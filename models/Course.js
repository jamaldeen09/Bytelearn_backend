import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
});

export const skillSchema = new mongoose.Schema({
  skillTitle: { type: String, required: true },
  content: { type: String, required: true }
})

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  skills: [ skillSchema ],
});

const courseSchema = new mongoose.Schema({    
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  topics: [topicSchema],
  dateCreated: { type: Date, default: Date.now },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isPublished: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },      
  enrollments: { type: Number, default: 0 },
  quiz: [quizSchema], 


  feedbackRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedbackRoom",
    default: null, 
  },

  peopleEnrolled: {
    type: [ mongoose.Schema.Types.ObjectId ],
    default: [],
  },

  version: { 
    type: Number, 
    default: 1 
  },

  isArchived: {
    type: Boolean,
    default: false
  },
});                                  

export default mongoose.model("Course", courseSchema);
