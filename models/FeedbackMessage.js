import mongoose from "mongoose"

const feedbackMessageSchema = new mongoose.Schema({
    feedbackRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedbackRoom",
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },  
    content: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    editedAt: {
        type: Date,
        default: null 
    },
    isEdited: {
        type: Boolean,
        default: false 
    },
    editWindow: {
        type: Date,
        defaut: null
    },
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: "User",
        default: [],
    }

})

export default mongoose.model("FeedbackMessage", feedbackMessageSchema)   