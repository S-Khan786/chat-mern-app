import {Server} from 'socket.io';
import http from 'http';
import express from 'express';
import 'dotenv/config';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import Conversation from '../models/conversationSchema.js';
import Message from '../models/messageSchema.js';

const app = express();

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin: process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) || true,
        methods:["GET","POST"],
        credentials: true,
    }
});

const userSocketmap={}; //{userId,socketId}
const presence = process.env.REDIS_URL ? createClient({ url: process.env.REDIS_URL }) : null;

if (presence) {
    presence.on('error', (error) => console.error('Redis presence error:', error.message));
    presence.connect().catch((error) => console.error('Redis presence unavailable:', error.message));
}

export const getReciverSocketId = async (receiverId) => {
    if (presence?.isReady) return presence.hGet('chat:presence', receiverId);
    return userSocketmap[receiverId];
};

const onlineUsers = async () => presence?.isReady ? presence.hKeys('chat:presence') : Object.keys(userSocketmap);
const roomName = (conversationId) => `conversation:${conversationId}`;
const userRoom = (userId) => `user:${userId}`;

export const emitToUser = (userId, event, payload) => {
    const room = userRoom(userId);
    const socketIds = [...(io.sockets.adapter.rooms.get(room) || [])];
    console.log(`[socket:emit:user] event=${event} userId=${userId} room=${room} sockets=${socketIds.length} socketIds=${socketIds.join(",") || "none"} messageId=${payload?._id || payload?.messageId || "n/a"}`);
    socketIds.forEach((socketId) => io.sockets.sockets.get(socketId)?.emit(event, payload));
};

export const emitToConversationMembers = async (conversationId, event, payload) => {
    const conversation = await Conversation.findById(conversationId).select('participants').lean();
    if (!conversation) {
        console.warn(`[socket:emit:conversation] missing conversationId=${conversationId} event=${event}`);
        return;
    }
    console.log(`[socket:emit:conversation] event=${event} conversationId=${conversationId} participants=${conversation.participants.map(String).join(",")} messageId=${payload?._id || payload?.messageId || "n/a"}`);
    for (const participantId of conversation.participants) {
        emitToUser(participantId.toString(), event, payload);
    }
};

const canAccessConversation = async (conversationId, userId) => {
    if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(userId)) return false;
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId }).select('_id').lean();
    return Boolean(conversation);
};

const updateReceipt = async (messageId, userId, status) => {
    if (!mongoose.isValidObjectId(messageId) || !mongoose.isValidObjectId(userId)) return null;
    const message = await Message.findById(messageId);
    if (!message || !(await canAccessConversation(message.conversationId, userId))) return null;
    const existing = message.deliveryStatus.find((receipt) => receipt.userId.equals(userId));
    if (existing) {
        if (status === 'read' || existing.status !== 'read') existing.status = status;
        existing.at = new Date();
    } else {
        message.deliveryStatus.push({ userId, status, at: new Date() });
    }
    await message.save();
    return { messageId: message._id, userId, status, conversationId: message.conversationId };
};

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`[socket:connection] socketId=${socket.id} userId=${userId || "missing"} transport=${socket.conn.transport.name}`);

    if (userId && userId !== "undefined") {
        socket.join(userRoom(userId));
        userSocketmap[userId] = socket.id;
        console.log(`[socket:room:join] socketId=${socket.id} room=${userRoom(userId)}`);
        if (presence?.isReady) await presence.hSet('chat:presence', userId, socket.id);
    }
    io.emit("getOnlineUsers", await onlineUsers());

    socket.on('joinConversation', async ({ conversationId } = {}) => {
        if (await canAccessConversation(conversationId, userId)) socket.join(roomName(conversationId));
    });

    socket.on('leaveConversation', ({ conversationId } = {}) => {
        if (mongoose.isValidObjectId(conversationId)) socket.leave(roomName(conversationId));
    });

    const broadcastTyping = async (conversationId, typing) => {
        if (await canAccessConversation(conversationId, userId)) {
            await emitToConversationMembers(conversationId, 'typing', { conversationId, userId, typing });
        }
    };

    socket.on('typing:start', ({ conversationId } = {}) => broadcastTyping(conversationId, true));
    socket.on('typing:stop', ({ conversationId } = {}) => broadcastTyping(conversationId, false));

    const broadcastReceipt = async (messageId, status) => {
        const receipt = await updateReceipt(messageId, userId, status);
        if (receipt) io.to(roomName(receipt.conversationId)).emit('messageReceipt', receipt);
    };

    socket.on('message:delivered', ({ messageId } = {}) => broadcastReceipt(messageId, 'delivered'));
    socket.on('message:read', ({ messageId } = {}) => broadcastReceipt(messageId, 'read'));

    socket.on('disconnect', async () => {
        console.log(`[socket:disconnect] socketId=${socket.id} userId=${userId || "missing"}`);
        if (userId) {
            delete userSocketmap[userId];
            if (presence?.isReady && await presence.hGet('chat:presence', userId) === socket.id) {
                await presence.hDel('chat:presence', userId);
            }
        }
        io.emit('getOnlineUsers', await onlineUsers());
    });
});

export {app , io , server};

