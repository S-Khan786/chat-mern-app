import Conversation from "../models/conversationSchema.js";
import User from "../models/userSchema.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getUserBySearch = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (!search) return res.status(200).json([]);
    const expression = new RegExp(escapeRegex(search), "i");
    const users = await User.find({ _id: { $ne: req.user._id }, $or: [{ username: expression }, { fullname: expression }] }).select("-password -email").limit(25);
    return res.status(200).json(users);
  } catch (error) {
    console.error("User search error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to search users" });
  }
};

export const getCurrentChatters = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }).sort({ updatedAt: -1 });
    const ids = [...new Set(conversations.flatMap(({ participants }) => participants.map(String)).filter((id) => id !== req.user._id.toString()))];
    if (!ids.length) return res.status(200).json([]);
    const users = await User.find({ _id: { $in: ids } }).select("-password -email");
    const byId = new Map(users.map((user) => [user._id.toString(), user]));
    return res.status(200).json(ids.map((id) => byId.get(id)).filter(Boolean));
  } catch (error) {
    console.error("Current chatters error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load conversations" });
  }
};

