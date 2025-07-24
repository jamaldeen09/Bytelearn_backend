import express from "express";
import { handler } from "../controllers/openAiController.js";
import { body } from "express-validator";
import { isExsistingCourse, validationMiddleware, verifyAccessToken } from "../middlewares/auth.js";
const aiRouter = express.Router();

aiRouter.post("/api/create-course", verifyAccessToken, body("promptCourseName").notEmpty().isString(), body("promptCourseDescription").notEmpty().isString(), body("promptCategory").notEmpty().isString(),
    validationMiddleware, isExsistingCourse ,handler)

export default aiRouter