import mongoose from "mongoose";
import Conversation from "../models/conversationSchema.js";
import Message from "../models/messageSchema.js";
import { emitToConversationMembers, io } from "../Socket/socket.js";

const invalidUser = (id) => !mongoose.isValidObjectId(id);
const roomName = (conversationId) => `conversation:${conversationId}`;
const isMember = (conversation, userId) => conversation?.participants.some((participant) => String(participant._id || participant) === String(userId));

const publishMessage = async (message, conversation) => {
  await emitToConversationMembers(conversation._id, "newMessage", message);
};

const createMessage = async ({ conversation, senderId, message, attachment }) => {
  const content = typeof message === "string" ? message.trim() : "";
  const hasAttachment = attachment && typeof attachment.url === "string" && attachment.url.trim();
  if (!content && !hasAttachment) throw new Error("Message cannot be empty");
  if (content.length > 4000) throw new Error("Message is too long");
  const receiverId = conversation.type === "direct"
    ? conversation.participants.find((participant) => !participant.equals(senderId))
    : undefined;
  const newMessage = await Message.create({
    senderId,
    receiverId,
    message: content || undefined,
    attachment: hasAttachment ? attachment : undefined,
    conversationId: conversation._id,
  });
  console.log(`[message:created] messageId=${newMessage._id} conversationId=${conversation._id} senderId=${senderId} type=${conversation.type}`);
  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { lastMessage: { messageId: newMessage._id, senderId, content: content || "Attachment", createdAt: newMessage.createdAt }, updatedAt: newMessage.createdAt } }
  );
  await publishMessage(newMessage, conversation);
  return newMessage;
};

const messageErrorStatus = (error) => ["Message cannot be empty", "Message is too long"].includes(error.message) ? 400 : 500;

export const sendMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    if (invalidUser(receiverId)) return res.status(400).json({ success: false, message: "Invalid recipient" });
    if (req.user._id.toString() === receiverId) return res.status(400).json({ success: false, message: "You cannot message yourself" });
    let conversation = await Conversation.findOne({ type: "direct", participants: { $all: [req.user._id, receiverId] } });
    if (!conversation) conversation = await Conversation.create({ type: "direct", participants: [req.user._id, receiverId] });
    const newMessage = await createMessage({ conversation, senderId: req.user._id, message: req.body.message, attachment: req.body.attachment });
    console.log(`[message:send:response] messageId=${newMessage._id} senderId=${req.user._id} receiverId=${receiverId}`);
    return res.status(201).json(newMessage);
  } catch (error) {
    const status = messageErrorStatus(error);
    console.error("Send message error:", error.message);
    return res.status(status).json({ success: false, message: status === 400 ? error.message : "Unable to send message" });
  }
};

export const sendConversationMessage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid conversation" });
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (!isMember(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    const newMessage = await createMessage({ conversation, senderId: req.user._id, message: req.body.message, attachment: req.body.attachment });
    return res.status(201).json(newMessage);
  } catch (error) {
    const status = messageErrorStatus(error);
    console.error("Send conversation message error:", error.message);
    return res.status(status).json({ success: false, message: status === 400 ? error.message : "Unable to send message" });
  }
};

const getPaginatedMessages = async (conversationId, req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 100);
  const query = { conversationId };
  if (req.query.before && mongoose.isValidObjectId(req.query.before)) query._id = { $lt: req.query.before };
  const messages = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  messages.reverse();
  return res.status(200).json({ conversationId, messages, hasMore, nextCursor: messages[0]?._id || null });
};

export const getMessage = async (req, res) => {
  try {
    if (invalidUser(req.params.id)) return res.status(400).json({ success: false, message: "Invalid recipient" });
    const conversation = await Conversation.findOne({ type: "direct", participants: { $all: [req.user._id, req.params.id] } }).select("_id").lean();
    if (!conversation) return res.status(200).json({ messages: [], hasMore: false, nextCursor: null });
    return getPaginatedMessages(conversation._id, req, res);
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load messages" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid conversation" });
    const conversation = await Conversation.findById(req.params.id).select("_id participants").lean();
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (!isMember(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    return getPaginatedMessages(conversation._id, req, res);
  } catch (error) {
    console.error("Get conversation messages error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load messages" });
  }
};

const updateReceipt = async (req, res, status) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid message" });
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    const conversation = await Conversation.findById(message.conversationId).select("participants");
    if (!isMember(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    const existing = message.deliveryStatus.find((receipt) => receipt.userId.equals(req.user._id));
    if (existing) {
      if (status === "read" || existing.status !== "read") existing.status = status;
      existing.at = new Date();
    } else {
      message.deliveryStatus.push({ userId: req.user._id, status, at: new Date() });
    }
    await message.save();
    await emitToConversationMembers(message.conversationId, "messageReceipt", { messageId: message._id, userId: req.user._id, status });
    return res.status(200).json({ messageId: message._id, userId: req.user._id, status });
  } catch (error) {
    console.error("Update receipt error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update message receipt" });
  }
};

export const markDelivered = (req, res) => updateReceipt(req, res, "delivered");
export const markRead = (req, res) => updateReceipt(req, res, "read");

export const setReaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid message" });
    const emoji = typeof req.body.emoji === "string" ? req.body.emoji.trim() : "";
    if (!emoji || emoji.length > 16) return res.status(400).json({ success: false, message: "A valid reaction is required" });
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    const conversation = await Conversation.findById(message.conversationId).select("participants");
    if (!isMember(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    const existing = message.reactions.find((reaction) => reaction.userId.equals(req.user._id));
    if (existing) existing.emoji = emoji;
    else message.reactions.push({ userId: req.user._id, emoji });
    await message.save();
    await emitToConversationMembers(message.conversationId, "messageReaction", { messageId: message._id, userId: req.user._id, emoji });
    return res.status(200).json(message.reactions);
  } catch (error) {
    console.error("Set reaction error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save reaction" });
  }
};

export const removeReaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid message" });
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    const conversation = await Conversation.findById(message.conversationId).select("participants");
    if (!isMember(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    message.reactions = message.reactions.filter((reaction) => !reaction.userId.equals(req.user._id));
    await message.save();
    await emitToConversationMembers(message.conversationId, "messageReactionRemoved", { messageId: message._id, userId: req.user._id });
    return res.status(200).json(message.reactions);
  } catch (error) {
    console.error("Remove reaction error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to remove reaction" });
  }
};
