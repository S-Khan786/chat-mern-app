import Conversation from "../models/conversationSchema.js";
import User from "../models/userSchema.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getUserBySearch = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (!search) return res.status(200).json([]);
    const expression = new RegExp(escapeRegex(search), "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: expression }, { fullname: expression }],
    })
      .select("-password -email")
      .limit(25);
    return res.status(200).json(users);
  } catch (error) {
    console.error("User search error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Unable to search users" });
  }
};

export const getCurrentChatters = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "username fullname profilePic")
      .sort({ updatedAt: -1 })
      .lean();
    const directUserIds = [
      ...new Set(
        conversations
          .filter(({ type }) => type !== "group")
          .flatMap(({ participants }) => participants.map((participant) => String(participant._id || participant)))
          .filter((id) => id !== req.user._id.toString()),
      ),
    ];
    const groups = conversations
      .filter(({ type }) => type === "group")
      .map((conversation) => ({
        ...conversation,
      }));
    if (!directUserIds.length) return res.status(200).json(groups);
    const users = await User.find({ _id: { $in: directUserIds } }).select("-password -email");
    const byId = new Map(users.map((user) => [user._id.toString(), user]));
    return res.status(200).json([
      ...groups,
      ...directUserIds.map((id) => byId.get(id)).filter(Boolean),
    ]);
  } catch (error) {
    console.error("Current chatters error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load conversations" });
  }
};
