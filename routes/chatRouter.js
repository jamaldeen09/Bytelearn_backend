import express from "express";
import {
  validationMiddleware,
  verifyAccessToken,
} from "../middlewares/auth.js";
import { deleteNotification, getFriends, getNotifications, getUnreadMessages } from "../controllers/chatController.js";
import { param } from "express-validator";

export const chatRouter = express.Router();


chatRouter.get("/api/unread-messages", verifyAccessToken, getUnreadMessages);

chatRouter.get("/api/get-friends", verifyAccessToken, getFriends);
chatRouter.get("/api/get-notifications", verifyAccessToken, getNotifications)
chatRouter.delete("/api/delete-notification/:notificationId", verifyAccessToken, 
  param("notificationId")
  .notEmpty()
  .isString(),validationMiddleware, deleteNotification)

 