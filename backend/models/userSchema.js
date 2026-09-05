import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female"],
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    profilePic: {
        type: String,
        required: true,
        default: ""
    }
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;

