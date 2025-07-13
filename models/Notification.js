import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    briefContent: {
        type: String,
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: Date.now()
    },
    requestStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected"], 
        default: "pending"
    }
})

export default mongoose.model("Notification", notificationSchema)