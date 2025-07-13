
import express from "express";
import {
  enrollToACourse,
  fetchCourses,
  getCompletedSkills,
  getEnrolledCourses,
  getProgessData,
  getSingleCourseDetails,
  markSkillAsCompleted,
  updateLastVisitedSkill,
} from "../controllers/courseController.js";
import {
  validationMiddleware,
  verifyAccessToken,
} from "../middlewares/auth.js";
import { body, param } from "express-validator";

export const courseRouter = express.Router();


courseRouter.get("/api/courses", fetchCourses);


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