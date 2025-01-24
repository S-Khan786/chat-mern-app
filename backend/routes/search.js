import express from 'express';
import isLogin from '../config/middleware.js';
import { getCurrentChatters, getUserBySearch } from '../controllers/searchHandler_controller.js';

const router = express.Router();

router.get('/search', isLogin, getUserBySearch);
router.get('/currentchatters', isLogin, getCurrentChatters);

export default router;