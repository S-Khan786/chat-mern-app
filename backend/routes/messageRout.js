import express from 'express';
import { getMessage, sendMessage } from '../controllers/messages_controller.js';
import isLogin from '../config/middleware.js';

const router = express.Router();

router.post('/send/:id', isLogin ,sendMessage);

router.get('/:id', isLogin , getMessage);

export default router;