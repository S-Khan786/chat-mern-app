import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["direct", "group"],
        default: "direct",
        required: true,
    },
    name: {
        type: String,
        trim: true,
        maxlength: 120,
    },
    avatar: {
        type: String,
        trim: true,
    },
    participants:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lastMessage: {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        content: String,
        createdAt: Date,
    },
}, { timestamps: true });

conversationSchema.path("name").validate(
    function (name) {
        return this.type !== "group" || Boolean(name?.trim());
    },
    "A group conversation needs a name"
);

conversationSchema.path("admins").validate(
    function (admins) {
        return this.type !== "group" || admins?.every((admin) => this.participants?.some((participant) => participant.equals(admin)));
    },
    "Group admins must be participants"
);

conversationSchema.path("participants").validate(
    function (participants) {
        return this.type === "group" ? participants?.length >= 2 : participants?.length === 2;
    },
    "A direct conversation needs two participants; a group needs at least two"
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

