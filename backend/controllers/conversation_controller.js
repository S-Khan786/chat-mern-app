import mongoose from "mongoose";
import Conversation from "../models/conversationSchema.js";
import { emitToUser } from "../Socket/socket.js";

const validIds = (ids) => Array.isArray(ids) && ids.length > 0 && ids.every((id) => mongoose.isValidObjectId(id));

const isParticipant = (conversation, userId) => conversation.participants.some((participant) => String(participant._id || participant) === String(userId));

export const createGroupConversation = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const participants = Array.isArray(req.body.participants) ? req.body.participants : [];
    const allParticipants = [...new Set([req.user._id.toString(), ...participants.map(String)])];
    if (!name || name.length > 120) return res.status(400).json({ success: false, message: "A group name between 1 and 120 characters is required" });
    if (!validIds(allParticipants) || allParticipants.length < 2) return res.status(400).json({ success: false, message: "A group needs at least two valid participants" });

    const conversation = await Conversation.create({
      type: "group",
      name,
      avatar: typeof req.body.avatar === "string" ? req.body.avatar.trim() : undefined,
      participants: allParticipants,
      admins: [req.user._id],
    });
    await conversation.populate("participants", "username fullname profilePic");
    for (const participantId of conversation.participants) {
      emitToUser(participantId.toString(), "conversationCreated", conversation);
    }
    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Create group error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create group" });
  }
};

export const getConversation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid conversation" });
    const conversation = await Conversation.findById(req.params.id).populate("participants", "username fullname profilePic").lean();
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (!isParticipant(conversation, req.user._id)) return res.status(403).json({ success: false, message: "You are not a conversation member" });
    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load conversation" });
  }
};

export const updateGroupParticipants = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.body.userId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation or user" });
    }
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.type !== "group") return res.status(404).json({ success: false, message: "Group conversation not found" });
    if (!conversation.admins.some((admin) => admin.equals(req.user._id))) return res.status(403).json({ success: false, message: "Only group admins can manage members" });

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const action = req.body.action;
    if (!["add", "remove"].includes(action)) return res.status(400).json({ success: false, message: "Action must be add or remove" });
    if (action === "add" && !conversation.participants.some((participant) => participant.equals(userId))) conversation.participants.push(userId);
    if (action === "remove") {
      conversation.participants = conversation.participants.filter((participant) => !participant.equals(userId));
      conversation.admins = conversation.admins.filter((admin) => !admin.equals(userId));
    }
    if (conversation.participants.length < 2) return res.status(400).json({ success: false, message: "A group needs at least two participants" });
    await conversation.save();
    await conversation.populate("participants", "username fullname profilePic");
    if (action === "add") {
      emitToUser(userId.toString(), "conversationCreated", conversation);
    }
    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Update group members error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update group members" });
  }
};

export { isParticipant };