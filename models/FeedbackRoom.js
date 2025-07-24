import mongoose from "mongoose"

const feedbackRoomSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        unique: true,
    },
    messages: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "FeedbackMessage",
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
})

export default mongoose.model("FeedbackRoom", feedbackRoomSchema)