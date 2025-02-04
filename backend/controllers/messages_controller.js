import Conversation from "../models/conversationSchema.js";
import Message from "../models/messageSchema.js";
import { getReciverSocketId,io } from "../Socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId  = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all : [senderId, receiverId] }
        });

  

        if(!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            conversationId: conversation._id
        });

        // console.log(conversation);

        if(newMessage) {
            conversation.messages.push(newMessage._id);
        }

        
        await Promise.all([conversation.save(), newMessage.save()]);

        //SOCKET.IO function
        const reciverSocketId = getReciverSocketId(receiverId);
        if(reciverSocketId){
           io.to(reciverSocketId).emit("newMessage",newMessage)
        }

        res.status(201).send(newMessage);

    } catch(err) {
		console.log("Error in sendMessage controller: ", err.message);
		res.status(500).send({ error: "Internal server error" });
    }
}

export const getMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const senderId  = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages')

        if(!conversation)  return res.status(200).send([]);

        const message = conversation.messages;
        
        res.status(200).send(message);
    
    } catch(err) {
        console.log("Error in getMessage controller: ", err.message);
		res.status(500).send({ error: "Internal server error" });
    }
}