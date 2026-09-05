import express from 'express';
import { getMessage, sendMessage } from '../controllers/messages_controller.js';
import isLogin from '../config/middleware.js';
import rateLimit from '../config/rateLimit.js';

const router = express.Router();

router.post('/send/:id', isLogin, rateLimit({ windowMs: 60_000, max: 60 }), sendMessage);

router.get('/:id', isLogin , getMessage);

export default router;