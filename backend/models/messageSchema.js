import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    message: {
        type: String,
        trim: true,
        maxlength: 4000,
        required: function () { return !this.attachment?.url; },
    },
    attachment: {
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
        mimeType: { type: String, trim: true },
        size: { type: Number, min: 0 },
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    deliveryStatus: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ["delivered", "read"],
            default: "delivered",
        },
        at: {
            type: Date,
            default: Date.now,
        },
    }],
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        emoji: {
            type: String,
            required: true,
            trim: true,
            maxlength: 16,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }]
}, { timestamps : true });

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

