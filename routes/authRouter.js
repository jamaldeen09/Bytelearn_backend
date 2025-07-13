import express from "express";
import passport from "passport";
import {
  googleRedirect,
  studentSignup,
  getUsers,
  instructorSignup,
  forgotPassword,
  otpVerification,
  changePassword,
  login,
  verifyUser,
} from "../controllers/authController.js";
import {
  loginSchema,
  userCreationSchema,
  validationMiddleware,
  verifyAccessToken,
  verifyPasswordResetToken,
} from "../middlewares/auth.js";
import { body, checkSchema } from "express-validator";

export const authRouter = express.Router();


authRouter.get("/auth/google", (req, res, next) => {
  const state = req.query.state || "student";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
  })(req, res, next);
});


authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleRedirect
);

authRouter.post(
  "/api/signup",
  checkSchema(userCreationSchema),
  validationMiddleware,
  studentSignup
);
authRouter.get("/api/users", getUsers);
authRouter.post(
  "/api/instructorSignup",
  checkSchema(userCreationSchema),
  validationMiddleware,
  instructorSignup
);

authRouter.post(
  "/api/forgot-password",
  body("email")
    .notEmpty()
    .withMessage("An email address must be provided")
    .isEmail()
    .withMessage("Invalid email address"),
  validationMiddleware,
  forgotPassword
);

authRouter.post(
  "/api/verify-otp",
  verifyPasswordResetToken,
  body("otp")
    .notEmpty()
    .withMessage("Please provide an OTP")
    .isInt({ min: 6 })
    .withMessage("OTP must be 6 numbers"),
  validationMiddleware,
  otpVerification
);

authRouter.post(
  "/api/change-password",
  verifyPasswordResetToken,

  body("password")
    .notEmpty()
    .withMessage("A new password must be provided")
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 5 })
    .withMessage("New password must be at least 5 characters"),
  validationMiddleware,
  changePassword
);

authRouter.post(
  "/api/login",
  checkSchema(loginSchema),
  validationMiddleware,
  login
);

authRouter.get("/api/get-information", verifyAccessToken, verifyUser);
