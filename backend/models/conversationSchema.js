import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    participants:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    messages:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: []
        }
    ]
}, { timestamps: true });

conversationSchema.path("participants").validate(
    (participants) => participants?.length === 2,
    "A conversation must have exactly two participants"
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

