import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: String,
    googleId: { type: String }, 
    avatar: { type: String, default: "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg" },
    
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
    }],
    createdCourses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
    enrolledCourses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
    ],
    isOnline: {
        type: Boolean,
        default: false
    },
    generatedOtp: {
        type: String,
        default: null,
    },
    bio: {
        type: String,
        default: "Hello Bytelearn!"
    },
    lastSeen: {
        type: Date,
        default: Date.now(),
    },
    notifications: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: "Notification",
        default: [],
    },
    likedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: []
    }],
})

export default mongoose.model("User", userSchema)