import mongoose from "mongoose";
import Conversation from "../models/conversationSchema.js";
import Message from "../models/messageSchema.js";
import { getReciverSocketId, io } from "../Socket/socket.js";

const invalidUser = (id) => !mongoose.isValidObjectId(id);

export const sendMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (invalidUser(receiverId)) return res.status(400).json({ success: false, message: "Invalid recipient" });
    if (!message) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (message.length > 4000) return res.status(400).json({ success: false, message: "Message is too long" });
    const senderId = req.user._id;
    if (senderId.toString() === receiverId) return res.status(400).json({ success: false, message: "You cannot message yourself" });

    let conversation = await Conversation.findOne({ type: "direct", participants: { $all: [senderId, receiverId] } });
    if (!conversation) conversation = await Conversation.create({ type: "direct", participants: [senderId, receiverId] });
    const newMessage = await Message.create({ senderId, receiverId, message, conversationId: conversation._id });
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { lastMessage: { messageId: newMessage._id, senderId, content: message, createdAt: newMessage.createdAt }, updatedAt: newMessage.createdAt } }
    );
    const receiverSocketId = await getReciverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to send message" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    if (invalidUser(receiverId)) return res.status(400).json({ success: false, message: "Invalid recipient" });
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 100);
    const conversation = await Conversation.findOne({ type: "direct", participants: { $all: [req.user._id, receiverId] } }).select("_id").lean();
    if (!conversation) return res.status(200).json({ messages: [], hasMore: false, nextCursor: null });
    const query = { conversationId: conversation._id };
    if (req.query.before && mongoose.isValidObjectId(req.query.before)) query._id = { $lt: req.query.before };
    const messages = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    messages.reverse();
    return res.status(200).json({ messages, hasMore, nextCursor: messages[0]?._id || null });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load messages" });
  }
};

