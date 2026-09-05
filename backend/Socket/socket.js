import {Server} from 'socket.io';
import http from 'http';
import express from 'express';
import 'dotenv/config';
import { createClient } from 'redis';

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

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        userSocketmap[userId] = socket.id;
        if (presence?.isReady) await presence.hSet('chat:presence', userId, socket.id);
    }
    io.emit("getOnlineUsers", await onlineUsers());

    socket.on('disconnect', async () => {
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

