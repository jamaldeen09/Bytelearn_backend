import mongoose from "mongoose"

const progressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, required: true , ref: "User" },
    course: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Course" },
    completedSkills: [
        { type: mongoose.Schema.Types.ObjectId, required: true },
    ],
    lastVisitedSkill: { type: mongoose.Schema.Types.ObjectId, default: null},
    isCompleted: { type: Boolean, default: false },
    snapshottedCourse: { 
        type: mongoose.Schema.Types.Mixed, 
        default: null 
      }
}, { timestamps: true })

export default mongoose.model("Progress", progressSchema)

