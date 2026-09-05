import express from "express";
import isLogin from "../config/middleware.js";
import { createGroupConversation, getConversation, updateGroupParticipants } from "../controllers/conversation_controller.js";

const router = express.Router();

router.post("/group", isLogin, createGroupConversation);
router.get("/:id", isLogin, getConversation);
router.patch("/:id/participants", isLogin, updateGroupParticipants);

export default router;