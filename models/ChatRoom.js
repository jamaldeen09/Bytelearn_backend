import mongoose from "mongoose"

const chatRoomSchema = new mongoose.Schema({
    participants: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: "User",
        default: []
    },
    messages: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: "Message",
        default: [],
    },
    roomId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
})

export default mongoose.model("ChatRoom", chatRoomSchema)