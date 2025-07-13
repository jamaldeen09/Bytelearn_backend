import mongoose from "mongoose";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";

export const fetchCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate({
      path: "creator",
      model: "User",
    });

    const formattedCourses = courses.map((course) => {
      return {
        id: course._id,
        title: course.title,
        description: course.description,
        creator: {
          fullName: course.creator.fullName,
          email: course.creator.email,
          profilePicture: course.creator.avatar,
        },
        topics: course.topics,
        imageUrl: course.imageUrl,
        category: course.category,
      };
    });

    return res.status(200).send({ courses: formattedCourses });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const enrollToACourse = async (req, res) => {
  try {
    // expecting studentId, courseId,
    const { courseId } = req.data;
    const student = req.user.userId;

    // check if student requesting to enroll exists

    const enrollingStudent = await User.findById(student);
    if (!enrollingStudent)
      return res
        .status(406)
        .send({ success: false, msg: "Your Account was not found" });

    const courseToEnrollIn = await Course.findById(courseId);

    const alreadyEnrolled = await Progress.findOne({
      student,
      course: courseToEnrollIn._id,
    });
    if (alreadyEnrolled) {
      return res.status(409).send({
        success: false,
        msg: "You are already enrolled in this course.",
      });
    }
    if (!courseToEnrollIn)
      return res.status(404).send({
        success: false,
        msg: "Course you are trying to enroll in does not exist",
      });

    const newProgress = await Progress.create({
      student,
      course: courseToEnrollIn._id,
      isCompleted: false
    });
    if (!enrollingStudent.courses.includes(courseToEnrollIn._id)) {
      enrollingStudent.courses.push(courseToEnrollIn._id);
    }

    await enrollingStudent.save();
    return res.status(200).send({
      success: true,
      msg: `Successfuly enrolled in ${courseToEnrollIn.title}`,
      progress: newProgress,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const markSkillAsCompleted = async (req, res) => {
  try {
    if (!req.user.userId) {
      return res
        .status(401)
        .send({ success: false, msg: "Unauthorized Access" });
    }

    const { courseId, skillId } = req.data;

    const progress = await Progress.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(200).send({
        success: false,
        msg: "No progress data found for this course",
      });
    }

    const course = await Course.findById(courseId);
    const totalSkillsCount = course.topics.reduce(
      (sum, topic) => sum + topic.skills.length,
      0
    );
    if (progress.completedSkills.length === totalSkillsCount) {
      progress.isCompleted = true;
    }
    if (!course) {
      return res.status(404).send({
        success: false,
        msg: "Course not found",
      });
    }

    const skillExists = course.topics.some((topic) =>
      topic.skills.some((skill) =>
        skill._id.equals(new mongoose.Types.ObjectId(skillId))
      )
    );

    if (!skillExists) {
      return res.status(404).send({
        success: false,
        msg: "Skill not found in this course",
      });
    }

    // Update last visited skill
    progress.lastVisitedSkill = new mongoose.Types.ObjectId(skillId);

    // Only add to completedSkills if not already there
    if (
      !progress.completedSkills.includes(new mongoose.Types.ObjectId(skillId))
    ) {
      progress.completedSkills.push(new mongoose.Types.ObjectId(skillId));
    }

    await progress.save();

    return res.status(200).send({
      success: true,
      msg: "Skill marked as completed successfully",
      completedSkills: progress.completedSkills,
      lastVisitedSkill: progress.lastVisitedSkill,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      msg: "Server error while marking skill as completed",
    });
  }
};

export const getSingleCourseDetails = async (req, res) => {
  try {
    if (!req.user.userId)
      return res
        .status(401)
        .send({ success: false, msg: "Unauthorized Access" });
    const { id } = req.data;

    // check for exsisting course  
    const requestedCourse = await Course.findById(id).populate({
      path: "creator",
      model: "User",
    });
    const data = {
      title: requestedCourse.title,
      _id: requestedCourse._id,
      creator: {
        fullName: requestedCourse.creator.fullName,
        email: requestedCourse.creator.email,
        profilePicture: requestedCourse.creator.avatar,
      },
      imageUrl: requestedCourse.imageUrl,
      topics: requestedCourse.topics,
      dateCreated: requestedCourse.dateCreated,
      isPublished: requestedCourse.isPublished,
    };

    if (!requestedCourse)
      return res
        .status(404)
        .send({ success: false, msg: "Course does not exsist" });

    return res.status(200).send({ success: true, courseDetails: data });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const getCompletedSkills = async (req, res) => {
  try {
    if (!req.user.userId)
      return res
        .status(401)
        .send({ success: false, msg: "Unauthorized Access" });

    const { courseId } = req.data;
    const existingAcc = await User.findById(req.user.userId);

    if (!existingAcc)
      return res.status(404).send({ success: false, msg: "Account not found" });

    // Get progress data
    const progress = await Progress.findOne({
      student: existingAcc._id,
      course: courseId,
    });

    // Get course data
    const course = await Course.findById(courseId);

    if (!progress || !course) {
      return res.status(200).send({
        success: true,
        completedSkills: [],
        allSkills: [],
      });
    }

    // Extract all skills from course
    const allSkills = course.topics.flatMap((topic) =>
      topic.skills.map((skill) => ({
        ...skill.toObject(),
        topicId: topic._id,
        topicTitle: topic.title,
      }))
    );

    // Match completed skills with full data
    const completedSkillsData = allSkills.filter((skill) =>
      progress.completedSkills.some((id) => id.equals(skill._id))
    );

    return res.status(200).send({
      success: true,
      completedSkills: completedSkillsData,
      allSkills,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const updateLastVisitedSkill = async (req, res) => {
  try {
    if (!req.user.userId) {
      return res
        .status(401)
        .send({ success: false, msg: "Unauthorized Access" });
    }

    const { courseId, skillId } = req.data;
    const progress = await Progress.findOneAndUpdate(
      { student: req.user.userId, course: courseId },
      {
        lastVisitedSkill: new mongoose.Types.ObjectId(skillId),
        lastVisitedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      msg: "Last visited skill updated",
      lastVisitedSkill: progress.lastVisitedSkill,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ 
      success: false,
      msg: "Server error while updating last visited skill",
    });
  }
};

export const getProgessData = async (req, res) => {
  try {
    const progress = await Progress.find({ student: req.user.userId })
    .select('course completedSkills lastVisitedSkill isCompleted');

    res.status(200).send({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const getEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('courses');
    res.status(200).send({ courses: user.courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
