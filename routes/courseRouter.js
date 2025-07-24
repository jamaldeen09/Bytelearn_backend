
import express from "express";
import {
  deleteCreatedCourse,
  draftCourse,
  enrollToACourse,
  fetchCourses,
  getCompletedSkills,
  getCoursesCreatedBySomeone,
  getCourseStats,
  getEnrolledCourses,
  getEnrollmentsDetails,
  getFeedbackMetrics,
  getMetrics,
  getMostPopularCourses,
  getMostRecentFeedbacks,
  getProgessData,
  getSingleCourseDetails,
  likeCourse,
  markSkillAsCompleted,
  publishCourse,
  unenrollFromCourse,
  unLikeCourse,
  updateLastVisitedSkill,
  verifyEnrollment,
} from "../controllers/courseController.js";
import {
  validationMiddleware,
  verifyAccessToken,
} from "../middlewares/auth.js";
import { body, param } from "express-validator";
import Progress from "../models/Progress.js";
import FeedbackMessage from "../models/FeedbackMessage.js";

export const courseRouter = express.Router();


courseRouter.get("/api/courses", verifyAccessToken, fetchCourses);


courseRouter.post(
  "/api/enroll",
  verifyAccessToken,
  body("courseId")
    .notEmpty()
    .withMessage("A course id must be provided")
    .isString()
    .withMessage("Course id must be a string"),
  validationMiddleware,
  enrollToACourse
);


courseRouter.get(
  "/api/single-course/:id",
  verifyAccessToken,
  param("id")
    .notEmpty()
    .withMessage("An id must be provided")
    .isString()
    .withMessage("id must be a string"),
  validationMiddleware,
  getSingleCourseDetails
);


courseRouter.post(
  "/api/mark-skill-as-completed",
  verifyAccessToken,
  body("courseId")
    .notEmpty()
    .withMessage("A courseId must be provided")
    .isString()
    .withMessage("courseId must be a string"),
  body("skillId")
    .notEmpty()
    .withMessage("A skillId must be provided")
    .isString()
    .withMessage("skillId must be a string"),
  validationMiddleware,
  markSkillAsCompleted
);


courseRouter.get(
  "/api/completed-skills/:courseId",
  verifyAccessToken,
  param("courseId")
    .notEmpty()
    .withMessage("courseId query parameter is required")
    .isString()
    .withMessage("courseId must be a string"),
  validationMiddleware,
  getCompletedSkills
);

courseRouter.post("/api/update-last-visited", verifyAccessToken,
  body('courseId').notEmpty().isString(),
  body('topicId').notEmpty().isString(),
  body('skillId').notEmpty().isString(),
  validationMiddleware,
  updateLastVisitedSkill,
)

courseRouter.get(
  "/api/progress",
  verifyAccessToken,
  getProgessData,
);

courseRouter.get(
  "/api/enrolled-courses",
  verifyAccessToken,
  getEnrolledCourses,
) 

courseRouter.delete("/api/enrolled-courses/:courseId", verifyAccessToken, unenrollFromCourse)
courseRouter.get("/api/creators-work/:creatorsFullName", param("creatorsFullName").notEmpty().isString().isLength({ min: 3 }), validationMiddleware, getCoursesCreatedBySomeone)
courseRouter.get("/api/progress", async () => await Progress.find());
courseRouter.post("/api/like-course", verifyAccessToken , body("courseId").notEmpty().isString(), validationMiddleware, likeCourse)
courseRouter.post("/api/unlike-course", verifyAccessToken, body("courseId").notEmpty().isString(), validationMiddleware, unLikeCourse)
courseRouter.put("/api/publish-course", verifyAccessToken, body("courseId").notEmpty().isString(), validationMiddleware, publishCourse)
courseRouter.put("/api/draft-course", verifyAccessToken, body("courseId").notEmpty().isString(), validationMiddleware, draftCourse)
courseRouter.delete("/api/delete-createdCourse/:courseId", verifyAccessToken, param("courseId").notEmpty().isString(), validationMiddleware, deleteCreatedCourse)
courseRouter.get("/api/most-popular-courses", verifyAccessToken, getMostPopularCourses)
courseRouter.get("/api/course-stats/:courseId", verifyAccessToken , param("courseId").notEmpty().isString(), validationMiddleware, getCourseStats)
courseRouter.get("/api/profile-metrics", verifyAccessToken, getMetrics)
courseRouter.get("/api/course-enrollments", verifyAccessToken, getEnrollmentsDetails)
courseRouter.get("/api/feedback-metrics", verifyAccessToken, getFeedbackMetrics)
courseRouter.get("/api/most-recent-feedback", verifyAccessToken, getMostRecentFeedbacks)
courseRouter.get("/api/verify-enrollment/:courseId", verifyAccessToken, verifyEnrollment)
courseRouter.get("/api/feedback-msgs", async (req, res) => res.status(200).json(await FeedbackMessage.find()))