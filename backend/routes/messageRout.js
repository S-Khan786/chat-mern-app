import express from 'express';
import isLogin from '../config/middleware.js';
import rateLimit from '../config/rateLimit.js';
import { getConversationMessages, getMessage, markDelivered, markRead, removeReaction, sendConversationMessage, sendMessage, setReaction } from '../controllers/messages_controller.js';

const router = express.Router();

router.post('/send/:id', isLogin, rateLimit({ windowMs: 60_000, max: 60 }), sendMessage);
router.post('/conversation/:id/send', isLogin, rateLimit({ windowMs: 60_000, max: 60 }), sendConversationMessage);
router.get('/conversation/:id', isLogin, getConversationMessages);
router.patch('/:id/delivered', isLogin, markDelivered);
router.patch('/:id/read', isLogin, markRead);
router.put('/:id/reaction', isLogin, setReaction);
router.delete('/:id/reaction', isLogin, removeReaction);

router.get('/:id', isLogin , getMessage);

export default router;