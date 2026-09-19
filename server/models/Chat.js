import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    userId : {type: String, ref: 'User', required: true},
    userName : {type: String, required: true},
    name : {type: String, required: true},
    messages: [
        {
            isImage: { type: Boolean, required: true },
            isPublished: { type: Boolean, default: false },
            role: { type: String, required: true },
            content: { type: String, required: true },
            // Public ImageKit URLs for photos attached by the user to a
            // message (an array because a message can carry up to 5 images).
            image: { type: [String], default: [] },
            timestamp: { type: Number, required: true },
            prompt: { type: String, default: '' },
            likes: { type: [String], default: [] },
        }
    ]
}, {timestamps: true})

const Chat = mongoose.model('Chat', ChatSchema)

export default Chat;