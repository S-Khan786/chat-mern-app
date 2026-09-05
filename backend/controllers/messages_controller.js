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

    let conversation = await Conversation.findOne({ participants: { $all: [senderId, receiverId] } });
    if (!conversation) conversation = await Conversation.create({ participants: [senderId, receiverId] });
    const newMessage = await Message.create({ senderId, receiverId, message, conversationId: conversation._id });
    conversation.messages.push(newMessage._id);
    await conversation.save();
    const receiverSocketId = getReciverSocketId(receiverId);
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
    const conversation = await Conversation.findOne({ participants: { $all: [req.user._id, receiverId] } }).populate({ path: "messages", options: { sort: { createdAt: 1 } } });
    return res.status(200).json(conversation?.messages || []);
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load messages" });
  }
};

