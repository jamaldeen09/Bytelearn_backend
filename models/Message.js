import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    roomId: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sending"
    },
    content: {
        type: String, 
    },

    sentAt: {
        type: Date,
        default: Date.now()
    },
    deliveredAt: Date,
    readAt: Date
}, { 
    // Auto timestamps
    timestamps: true 
});

export default mongoose.model("Message", messageSchema);