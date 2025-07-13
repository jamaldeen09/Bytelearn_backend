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
  quiz: [quizSchema],
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
  likes: { type: Number, defaut: 0 }
});

export default mongoose.model("Course", courseSchema);
