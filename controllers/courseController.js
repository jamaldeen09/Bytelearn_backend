import mongoose from "mongoose";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";
import FeedbackMessage from "../models/FeedbackMessage.js";
import FeedbackRoom from "../models/FeedbackRoom.js";


export const fetchCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({
        path: "creator",
        model: "User",
        select: "fullName email avatar",
      })
      .populate({
        path: "feedbackRoom",
        populate: {
          path: "messages",
          options: { sort: { createdAt: -1 } },
          populate: {
            path: "sender",
            model: "User",
            select: "fullName avatar"
          }
        }
      }).populate({
        path: "peopleEnrolled",
        model: "User",
        select: "fullName avatar bio"
      });

    let likedCoursesSet = new Set();



    if (req.user.userId) {
      const user = await User.findById(req.user.userId).select("likedCourses");
      likedCoursesSet = new Set(user?.likedCourses?.map(id => id.toString()));
    }

    const exsistingUser = await User.findById(req.user.userId).populate({
      path: "createdCourses",
      model: "Course",
    });


    const formattedCourses = courses.map((course) => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      imageUrl: course.imageUrl,
      likes: course.likes ?? 0,
      topics: course.topics,
      likedByCurrentUser: likedCoursesSet.has(course._id.toString()),
      creator: {
        _id: course.creator?._id,
        fullName: course.creator?.fullName,
        email: course.creator?.email,
        profilePicture: course.creator?.avatar,
      },
      feedbackMessages: course.feedbackRoom?.messages?.map((msg) => ({
        _id: msg._id,
        sender: {
          fullName: msg.sender?.fullName,
          profilePicture: msg.sender?.avatar,
        },
        text: msg.content,
        createdAt: msg.createdAt,
      })),
      peopleEnrolled: course.peopleEnrolled,
      enrollments: course.enrollments,
      isPublished: course?.isPublished,
      createdCourses: exsistingUser?.createdCourses
    }));
    const coursesFiltered = formattedCourses.filter((course) => course.isPublished)

    return res.status(200).json({ success: true, courses: coursesFiltered });
  } catch (err) {
    console.error("Error fetching courses:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching courses",
    });
  }
};

export const enrollToACourse = async (req, res) => {
  try {
    const { courseId } = req.data;
    const student = req.user.userId;

    // 1. Check if student exists
    const enrollingStudent = await User.findById(student);
    if (!enrollingStudent) {
      return res.status(406).send({
        success: false,
        msg: "Your account was not found",
      });
    }


    // 2. Check if course exists
    const courseToEnrollIn = await Course.findById(courseId);
    if (!courseToEnrollIn) {
      return res.status(404).send({
        success: false,
        msg: "Course you are trying to enroll in does not exist",
      });
    }


    // 3. Check if already enrolled (via Progress model)
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

    // 4. Create progress tracking
    const newProgress = await Progress.create({
      student,
      course: courseToEnrollIn._id,
      isCompleted: false,
    });


    // 5. Push course ID into `enrolledCourses` if not already present
    if (!enrollingStudent.enrolledCourses.includes(courseToEnrollIn._id)) {
      enrollingStudent.enrolledCourses.push(courseToEnrollIn._id);
      courseToEnrollIn.enrollments += 1;
      courseToEnrollIn.peopleEnrolled.push(enrollingStudent._id);
    }

    await courseToEnrollIn.save();
    await enrollingStudent.save();

    console.log(`PEOPLE ENROLLED IN ${courseToEnrollIn.title}: `, courseToEnrollIn.peopleEnrolled)

    return res.status(200).send({
      success: true,
      msg: `Successfully enrolled in ${courseToEnrollIn.title}`,
      progress: newProgress,
      enrolledAt: newProgress.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      msg: "Server error",
    });
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
      .select('course completedSkills lastVisitedSkill isCompleted  completionRate');

    res.status(200).send({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const getEnrolledCourses = async (req, res) => {
  try {
    const progressEntries = await Progress.find({ student: req.user.userId })
      .populate({
        path: 'course',
        populate: {
          path: 'creator',
          model: 'User',
          select: 'fullName email avatar' // Explicitly select fields
        }
      });

    // Filter out entries with missing courses and add null checks
    const courses = progressEntries
      .filter(entry => entry.course) // Remove entries with null courses
      .map((entry) => {
        const course = entry.course;
        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          category: course.category,
          topics: course.topics || [], // Default empty array if missing
          creator: {
            fullName: course.creator?.fullName,
            email: course.creator?.email,
            profilePicture: course.creator?.avatar,
          },
          progressData: {
            completedSkills: entry.completedSkills?.map(id => id.toString()) || [],
            isCompleted: entry.isCompleted || false,
            lastVisitedSkill: entry.lastVisitedSkill?.toString(),
          }
        };
      });

    res.status(200).send({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};



export const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;


    await User.findByIdAndUpdate(userId, {
      $pull: { enrolledCourses: courseId }
    });

    const course = await Course.findById(courseId)
    await Progress.deleteOne({ course: courseId, student: userId });

    if (course.enrollments > 0) {
      course.enrollments -= 1;
    }

    course.peopleEnrolled = course.peopleEnrolled.filter((person) => !person.equals(userId))
    await course.save()

    console.log(`NEW PEOPLE ENROLLED AFTER ENROLLMENT IN ${course.title}: `, course.peopleEnrolled)
    res.status(200).json({ msg: "Successfully unenrolled from course" });
  } catch (err) {
    console.error("Unenrollment failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getCoursesCreatedBySomeone = async (req, res) => {
  try {
    const { creatorsFullName } = req.data;
    const exsistingCreator = await User.findOne({ fullName: creatorsFullName })
      .populate({
        path: "createdCourses",
        model: "Course",
        select: "title description category imageUrl topics dateCreated creator isPublished likes enrollments",
        populate: [
          {
            path: "creator",
            model: "User",
            select: "fullName avatar email"
          },
        ]
      })
      .select("fullName avatar email createdCourses");


    const formattedCourses = exsistingCreator?.createdCourses?.map((createdCourse) => {
      return {
        _id: createdCourse?._id,
        title: createdCourse?.title,
        description: createdCourse?.description,
        category: createdCourse?.category,
        imageUrl: createdCourse?.imageUrl,
        topics: createdCourse?.topics,
        dateCreated: createdCourse?.dateCreated,
        creator: {
          _id: createdCourse.creator?._id,
          fullName: createdCourse?.creator?.fullName,
          profilePicture: createdCourse?.creator?.avatar,
          email: createdCourse?.creator.email,
        },
        enrollments: createdCourse?.enrollments,
        likes: createdCourse?.likes,
        isPublished: createdCourse?.isPublished
      }
    })


    return res.status(200).send({
      success: true, msg: `Fetched ${exsistingCreator?.fullName}'s works successfully`,
      data: formattedCourses?.filter((course) => course?.isPublished)
    })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server Error" })
  }
}

export const likeCourse = async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized Access" })

    const { courseId } = req.data;


    // check if user is valid
    const validUser = await User.findById(req.user.userId);
    if (!validUser)
      return res.status(406).send({ success: false, msg: "Account was not found please log in" })

    // check if the course exsists   
    const validCourse = await Course.findById(courseId);
    if (!validCourse)
      return res.status(404).send({ success: false, msg: "Course was not found" })

    // check if the user is trying to like his own course
    if (validUser._id.equals(validCourse.creator)) {
      return res.status(200).send({ success: false, msg: "You cannot like your own course" });
    }
    // check if course is already liked by the user
    if (validUser.likedCourses.includes(validCourse._id))
      return res.status(200).send({ success: true, msg: "Course is already liked", likedCourses: validUser.likedCourses, courseLiked: validCourse.likes })

    if (!validUser.likedCourses.includes(validCourse._id)) {
      validUser.likedCourses.push(validCourse._id);
      validCourse.likes += 1;

      await validCourse.save();
      await validUser.save();
      return res.status(200).send({ success: false, msg: "Course liked successfully", likedCourses: validUser.likedCourses, courseLiked: validCourse.likes })
    }

  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server error" })
  }
}

export const unLikeCourse = async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });

    const { courseId } = req.data;

    // fetch user normally
    const validUser = await User.findById(req.user.userId);
    if (!validUser)
      return res.status(406).send({ success: false, msg: "Account was not found, please log in" });

    // fetch course
    const validCourse = await Course.findById(courseId);
    if (!validCourse)
      return res.status(404).send({ success: false, msg: "Course was not found" });

    if (validUser.createdCourses.includes(courseId)) {
      return res.status(200).send({ success: false, msg: "You cannot unlike your own course" });
    }
    // check if it's even liked
    if (!validUser.likedCourses.includes(courseId)) {
      return res.status(200).send({ success: true, msg: "Course is not in liked courses" });
    }

    // update both sides
    validUser.likedCourses = validUser.likedCourses.filter(
      (id) => id.toString() !== courseId.toString()
    );
    validCourse.likes = Math.max(0, validCourse.likes - 1);

    await validUser.save();
    await validCourse.save();

    return res.status(200).send({
      success: true,
      msg: "Course unliked",
      likedCourses: validUser.likedCourses,
      courseLiked: validCourse.likes
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.data;
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized access" })

    const foundCourse = await Course.findByIdAndUpdate(courseId, {
      $set: { isPublished: true }
    })
    if (!foundCourse)
      return res.status(404).send({ success: false, msg: "Course was not found." })


    const user = await User.findById(req.user.userId).populate({
      path: "createdCourses",
      model: "Course",
      select: "title description category imageUrl topics dateCreated creator isPublished likes",
      populate: {
        path: "creator",
        model: "User",
        select: "fullName avatar"
      }
    })
      .select("fullName avatar email createdCourses");

    const createdCourses = user.createdCourses?.map((course) => {
      return {
        _id: course?._id,
        title: course?.title,
        description: course?.description,
        category: course?.category,
        imageUrl: course?.imageUrl,
        topics: course?.topics,
        dateCreated: course?.dateCreated,
        creator: {
          fullName: course?.creator?.fullName,
          profilePicture: course?.creator?.avatar,
        },
        isPublished: course?.isPublished,
        likes: course?.likes,
      }
    })



    return res.status(200).send({ success: true, msg: "Course published successfully", createdCourses })
  } catch (err) {
    console.error(err)
    return res.status(200).send({ success: false, msg: "Server error" })
  }
}

export const draftCourse = async (req, res) => {
  try {
    const { courseId } = req.data;
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized access" })



    const foundCourse = await Course.findByIdAndUpdate(courseId, {
      $set: { isPublished: false }
    })
    if (!foundCourse)
      return res.status(404).send({ success: false, msg: "Course was not found." })


    const user = await User.findById(req.user.userId).populate({
      path: "createdCourses",
      model: "Course",
      select: "title description category imageUrl topics dateCreated creator isPublished likes",
      populate: {
        path: "creator",
        model: "User",
        select: "fullName avatar"
      }
    })
      .select("fullName avatar email createdCourses");

    const createdCourses = user.createdCourses?.map((course) => {
      return {
        _id: course?._id,
        title: course?.title,
        description: course?.description,
        category: course?.category,
        imageUrl: course?.imageUrl,
        topics: course?.topics,
        dateCreated: course?.dateCreated,
        creator: {
          fullName: course?.creator?.fullName,
          email: course?.creator?.email,
          profilePicture: course?.creator?.avatar,
        },
        isPublished: course?.isPublished,
        likes: course?.likes,
      }
    })

    return res.status(200).send({ success: true, msg: "Course has been drafted successfully", createdCourses })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server error" })
  }
}

export const deleteCreatedCourse = async (req, res) => {
  try {
    const { courseId } = req.params; // Should be params, not data
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });
    }

    // 1. First find the course to get its feedback room
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send({ success: false, msg: "Course not found" });
    }

    // 2. Verify the user is the creator of the course
    if (course.creator.toString() !== userId) {
      return res.status(403).send({ success: false, msg: "You can only delete your own courses" });
    }

    // 3. Delete all feedback messages associated with this course's feedback room
    if (course.feedbackRoom) {
      await FeedbackMessage.deleteMany({ feedbackRoom: course.feedbackRoom });
      await FeedbackRoom.findByIdAndDelete(course.feedbackRoom);
    }

    // 4. Delete the course
    await Course.findByIdAndDelete(courseId);

    // 5. Remove the course from the user's createdCourses array
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { createdCourses: courseId } },
      { new: true }
    ).populate({
      path: "createdCourses",
      select: "title description category imageUrl topics dateCreated isPublished likes",
      populate: {
        path: "creator",
        select: "fullName avatar email"
      }
    });

    // 6. Delete any progress records for this course
    await Progress.deleteMany({ course: courseId });

    // 7. Return the updated list of created courses
    const createdCourses = user.createdCourses?.map(course => ({
      _id: course?._id,
      title: course?.title,
      description: course?.description,
      category: course?.category,
      imageUrl: course?.imageUrl,
      topics: course?.topics,
      dateCreated: course?.dateCreated,
      creator: {
        fullName: course?.creator?.fullName,
        email: course?.creator?.email,
        profilePicture: course?.creator?.avatar,
      },
      isPublished: course?.isPublished,
      likes: course?.likes,
    }));

    return res.status(200).send({
      success: true,
      msg: "Course deleted successfully",
      newCourses: createdCourses
    });
  } catch (err) {
    console.error("Error in deleteCreatedCourse:", err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const getMostPopularCourses = async (req, res) => {
  try {

    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "You must be logged in." })

    const coursesPopulated = await Course.find().populate({
      path: "creator",
      select: "fullName avatar email",
      populate: {
        path: "createdCourses",
        model: "Course"
      }
    })
    const mostLikedCourses = coursesPopulated
      .filter(course => course.likes > 0)
      .sort((a, b) => {
        const likeDiff = b.likes - a.likes;
        if (likeDiff !== 0) return likeDiff;

        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      })
      .slice(0, 10);


    const payload = mostLikedCourses.map(course => ({
      _id: course?._id,
      title: course?.title,
      description: course?.description,
      category: course?.category,
      imageUrl: course?.imageUrl,
      topics: course?.topics,
      dateCreated: course?.dateCreated,
      creator: {
        fullName: course.creator?.fullName,
        email: course.creator?.email,
        profilePicture: course.creator?.avatar,
      },
      createdCourses: course.creator?.createdCourses,
      isPublished: course?.isPublished,
      likes: course?.likes,
    }));
    const filteredMostLikedCourses = payload.filter((course) => course.isPublished)

    return res.status(200).send({ success: true, mostLikedCourses: filteredMostLikedCourses })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server error" })
  }
}


export const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.data;

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).send({ success: false, msg: "Course was not found" });
    }

    const courseStats = {
      enrollments: existingCourse.enrollments,
    };

    return res.status(200).send({ success: true, stats: courseStats });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server Error" });
  }
};

export const getMetrics = async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized Access" })

    const user = await User.findById(req.user.userId).populate(
      {
        path: "createdCourses",
        model: "Course",
      }
    )
    if (!user)
      return res.status(404).send({ success: false, msg: "Your account was not found" })

    const getTotalEnrollments = () => {
      let gettingTotal = 0;
      user.createdCourses?.forEach((course) => {
        gettingTotal += course.enrollments
      })

      return gettingTotal
    }

    const getAvgLikes = () => {

      let totalLikes = 0;
      let courseCount = 0;

      user.createdCourses?.forEach((course) => {
        totalLikes += course.likes;
        courseCount++;
      });

      const averageLikes = courseCount > 0 ? totalLikes / courseCount : 0;
      return Math.round(averageLikes);
    };

    const getMostPopularCourse = () => {
      const allLikes = []
      user.createdCourses?.forEach((course) => {
        allLikes.push(course.likes)
      })

      return user.createdCourses?.find((course) => course.likes === Math.max(...allLikes))
    };


    const getEngagementRatio = () => {

      const { totalLikes, totalEnrollments } = user.createdCourses?.reduce(
        (acc, course) => {
          acc.totalLikes += course.likes || 0;
          acc.totalEnrollments += course.enrollments || 0;
          return acc;
        },
        { totalLikes: 0, totalEnrollments: 0 }
      );

      return totalEnrollments > 0
        ? parseFloat((totalLikes / totalEnrollments).toFixed(1))
        : undefined;
    };

    const getAverageCompletion = async () => {
      let totalCompletion = 0;
      let coursesWithStudents = 0;

      for (const course of user?.createdCourses) {
        const totalSkills = course.topics.reduce(
          (sum, topic) => sum + topic.skills.length, 0
        );

        if (totalSkills === 0) continue;

        // Get all progress for this course
        const allProgress = await Progress.find({ course: course._id });

        if (allProgress.length === 0) continue;

        const courseCompletion = allProgress.reduce(
          (sum, progress) => sum + (progress.completedSkills.length / totalSkills), 0
        ) / allProgress.length;

        totalCompletion += courseCompletion * 100;
        coursesWithStudents++;
      }

      return coursesWithStudents > 0
        ? Math.round(totalCompletion / coursesWithStudents)
        : 0;
    };


    const totalEnrollments = getTotalEnrollments();
    const averageLikes = getAvgLikes();
    const mostPopularCourse = getMostPopularCourse();
    const engagementRatio = getEngagementRatio();
    const averageCompletionRate = await getAverageCompletion()


    return res.status(200).send({
      success: true, metricsData: {
        totalEnrollments,
        averageLikes,
        mostPopularCourse,
        engagementRatio,
        averageCompletionRate
      }
    })

  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server error" })
  }
}
export const getEnrollmentsDetails = async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });

    const user = await User.findById(req.user.userId).populate([
      {
        path: "createdCourses",
        model: "Course",
        select: "title likes",
        populate: [
          {
            path: "peopleEnrolled",
            model: "User",
            select: "fullName email avatar isOnline"
          },
          {
            path: "topics",
            select: "skills"
          }
        ]
      }
    ]);

    if (!user)
      return res.status(404).send({ success: false, msg: "Your account was not found" });

    if (!user?.createdCourses || user.createdCourses?.length === 0) {
      return res.status(200).send({
        success: true,
        enrollmentsData: {
          enrollments: [],
          stats: {
            totalEnrollments: 0,
            activeStudents: 0,
            totalLikes: 0
          }
        }
      });
    }

    // Get all progress records for the creator's courses at once
    const progressRecords = await Progress.find({
      course: { $in: user.createdCourses?.map(c => c._id) }
    }).populate('student', 'fullName email avatar isOnline');

    // Structure the data by course with null checks
    const enrollmentsByCourse = user.createdCourses?.map(course => {
      if (!course) return null;
      
      const totalSkills = course.topics?.reduce(
        (sum, topic) => sum + (topic?.skills?.length || 0), 0
      ) || 0;

      const courseProgress = progressRecords.filter(p => 
        p?.course && course?._id && p.course.equals(course._id)
      );

      const students = (course.peopleEnrolled || []).map(student => {
        if (!student) return null;
        
        const progress = courseProgress.find(p => 
          p?.student?._id && student?._id && p.student._id.equals(student._id)
        );
        
        const completedSkills = progress?.completedSkills?.length || 0;
        const progressPercentage = totalSkills > 0
          ? Math.round((completedSkills / totalSkills) * 100)
          : 0;

        return {
          _id: student._id?.toString(),
          fullName: student?.fullName,
          email: student?.email,
          avatar: student?.avatar,
          isOnline: student?.isOnline,
          enrolledAt: progress?.createdAt || new Date(),
          progress: progressPercentage,
          likes: course?.likes || 0
        };
      }).filter(Boolean); // Remove null entries

      return {
        courseId: course._id?.toString(),
        courseTitle: course?.title,
        students,
        courseLikes: course?.likes || 0
      };
    }).filter(Boolean); 

    // Flatten the structure with additional checks
    const formattedEnrollments = enrollmentsByCourse.flatMap(course =>
      (course?.students || []).map(student => ({
        id: student?._id,
        course: course?.courseTitle,
        student: student?.fullName,
        enrolledAt: student?.enrolledAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
        progress: student?.progress || 0,
        likes: course?.courseLikes || 0
      }))
    ).filter(Boolean);

    // Calculate statistics with null checks
    const totalLikes = enrollmentsByCourse.reduce(
      (sum, course) => sum + (course?.courseLikes || 0), 0
    );

    const uniqueStudentIds = new Set();
    user.createdCourses?.forEach(course => {
      (course?.peopleEnrolled || []).forEach(student => {
        if (student?._id) {
          uniqueStudentIds.add(student._id.toString());
        }
      });
    });

    // Count active students
    const activeStudentsCount = progressRecords.reduce((count, progress) => {
      if (progress?.completedSkills?.length > 0 && 
          progress?.student?._id && 
          !count.has(progress.student._id.toString())) {
        count.add(progress.student._id.toString());
      }
      return count;
    }, new Set()).size;

    return res.status(200).send({
      success: true,
      enrollmentsData: {
        enrollments: formattedEnrollments,
        stats: {
          totalEnrollments: formattedEnrollments.length,
          activeStudents: activeStudentsCount,
          totalLikes: totalLikes
        }
      }
    });

  } catch (err) {
    console.error("Error in getEnrollmentsDetails:", err);
    return res.status(500).send({ 
      success: false, 
      msg: "Server error",
      error: err.message 
    });
  }
};

export const getFeedbackMetrics = async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });

    const user = await User.findById(req.user.userId).populate([
      {
        path: "createdCourses",
        model: "Course",
        populate: [
          {
            path: "feedbackRoom",
            model: "FeedbackRoom",
            populate: {
              path: "messages",
              model: "FeedbackMessage",
              populate: {
                path: "sender",
                model: "User",
                select: "fullName avatar isOnline"
              }
            }
          },
          {
            path: "peopleEnrolled",
            model: "User",
            select: "fullName"
          }
        ]
      }
    ]);

    if (!user)
      return res.status(404).send({ success: false, msg: "Your account was not found." });

    // Calculate comprehensive feedback metrics
    const metrics = {
      overview: {
        totalCourses: user.createdCourses?.length,
        coursesWithFeedback: 0,
        totalFeedbackMessages: 0,
        totalLikesReceived: 0,
        avgFeedbackPerCourse: 0,
      },
      engagement: {
        enrollmentToFeedbackRatio: 0,
        mostActiveCourse: null,
        leastActiveCourse: null,
      },
      sentiment: {
        positiveFeedbackCount: 0,
        negativeFeedbackCount: 0,
        neutralFeedbackCount: 0,
      },
      temporal: {
        feedbackByMonth: {},
        recentFeedback: [],
      },
      courseBreakdown: [],
    };

    // Analyze each course
    user.createdCourses?.forEach(course => {
      const feedbackMessages = course.feedbackRoom?.messages || [];
      const enrollments = course.peopleEnrolled.length;
      const likes = course.likes;
      
      // Basic counts
      metrics.overview.totalFeedbackMessages += feedbackMessages.length;
      metrics.overview.totalLikesReceived += likes;
      if (feedbackMessages.length > 0) metrics.overview.coursesWithFeedback++;

      // Course-specific metrics
      const courseMetrics = {
        courseId: course._id,
        title: course.title,
        feedbackCount: feedbackMessages.length,
        enrollments,
        likes,
        feedbackRatio: enrollments > 0 ? (feedbackMessages.length / enrollments) * 100 : 0,
        recentMessages: feedbackMessages
          .slice(-3)
          .map(msg => ({
            content: msg.content,
            sender: msg.sender.fullName,
            date: msg.createdAt,
          })),
      };

      metrics.courseBreakdown.push(courseMetrics);

      // Track most/least active courses
      if (!metrics.engagement.mostActiveCourse || 
          feedbackMessages.length > metrics.engagement.mostActiveCourse.feedbackCount) {
        metrics.engagement.mostActiveCourse = courseMetrics;
      }
      if (!metrics.engagement.leastActiveCourse || 
          feedbackMessages.length < metrics.engagement.leastActiveCourse.feedbackCount) {
        metrics.engagement.leastActiveCourse = courseMetrics;
      }

      // Analyze sentiment (basic keyword-based analysis)
      feedbackMessages.forEach(msg => {
        const content = msg.content.toLowerCase();
        if (content.includes('great') || content.includes('awesome') || content.includes('love')) {
          metrics.sentiment.positiveFeedbackCount++;
        } else if (content.includes('bad') || content.includes('poor') || content.includes('terrible')) {
          metrics.sentiment.negativeFeedbackCount++;
        } else {
          metrics.sentiment.neutralFeedbackCount++;
        }

        // Track feedback by month
        const monthYear = new Date(msg.createdAt).toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        metrics.temporal.feedbackByMonth[monthYear] = (metrics.temporal.feedbackByMonth[monthYear] || 0) + 1;
      });
    });

    // Calculate averages
    if (user.createdCourses?.length > 0) {
      metrics.overview.avgFeedbackPerCourse = metrics.overview.totalFeedbackMessages / user.createdCourses?.length;
    }

    // Calculate enrollment to feedback ratio
    const totalEnrollments = user.createdCourses?.reduce((sum, course) => sum + course.peopleEnrolled.length, 0);
    if (totalEnrollments > 0) {
      metrics.engagement.enrollmentToFeedbackRatio = (metrics.overview.totalFeedbackMessages / totalEnrollments) * 100;
    }

    // Get recent feedback (last 5 messages across all courses)
    metrics.temporal.recentFeedback = user.createdCourses?.flatMap(course => 
        (course.feedbackRoom?.messages || [])
          .map(msg => ({
            course: course.title,
            message: msg.content,
            sender: msg.sender.fullName,
            date: msg.createdAt,
            likes: msg.likes,
          }))
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return res.status(200).send({ 
      success: true, 
      metrics 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};
export const getMostRecentFeedbacks = async (req, res) => {
  try {
    if (!req.user.userId) {
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });
    }

    const user = await User.findById(req.user.userId)
      .populate({
        path: "createdCourses",
        model: "Course",
        populate: {
          path: "feedbackRoom",
          model: "FeedbackRoom",
          populate: {
            path: "messages",
            model: "FeedbackMessage",
            options: { 
              sort: { createdAt: -1 },
              limit: 2
            },
            populate: {
              path: "sender",
              model: "User",
              select: "fullName avatar"
            }
          }
        }
      });

    if (!user) {
      return res.status(404).send({ success: false, msg: "User not found" });
    }

    // Extract and flatten all feedback messages
    const allFeedbacks = user.createdCourses?.flatMap(course => 
      course.feedbackRoom?.messages?.map(msg => ({
        courseId: course?._id,
        courseTitle: course?.title,
        message: msg.content,
        sender: msg?.sender?.fullName,
        senderAvatar: msg?.sender?.avatar,
        createdAt: msg?.createdAt,
        likes: msg?.likes || 0
      })) || []
    );

    // Sort all feedbacks by date (newest first) and take top 2
    const recentFeedbacks = allFeedbacks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2);

    return res.status(200).send({ 
      success: true, 
      feedbacks: recentFeedbacks 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const verifyEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ isEnrolled: false, error: "Unauthorized" });
    }

    const progress = await Progress.findOne({
      student: userId,
      course: courseId
    });

    const isEnrolled = !!progress;
    
    res.status(200).json({ isEnrolled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isEnrolled: false, error: "Server error" });
  }
};