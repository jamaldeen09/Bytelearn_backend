import express from "express";
import {
  validationMiddleware,
  verifyAccessToken,
} from "../middlewares/auth.js";
import { deleteNotification, getFriends, getNotifications, getUnreadMessages } from "../controllers/chatController.js";
import { param } from "express-validator";
import User from "../models/User.js";
import Message from "../models/Message.js";
import ChatRoom from "../models/ChatRoom.js";
import { events } from "../utils/events.js";

export const chatRouter = express.Router();


chatRouter.get("/api/unread-messages", verifyAccessToken, getUnreadMessages);

chatRouter.get("/api/get-friends", verifyAccessToken, getFriends);
chatRouter.get("/api/get-notifications", verifyAccessToken, getNotifications)
chatRouter.delete("/api/delete-notification/:notificationId", verifyAccessToken,
  param("notificationId")
    .notEmpty()
    .isString(), validationMiddleware, deleteNotification)

chatRouter.delete("/api/friends/:friendId", verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    // Remove each other from friends list
    await User.updateOne({ _id: userId }, { $pull: { friends: friendId } });
    await User.updateOne({ _id: friendId }, { $pull: { friends: userId } });

    // Delete all messages between them (both ways)
    await Message.deleteMany({
      $or: [
        { "sender._id": userId, "receiver._id": friendId },
        { "sender._id": friendId, "receiver._id": userId }
      ]
    });

    // Optionally: Delete chatroom if you're storing that separately
    await ChatRoom.deleteOne({
      participants: { $all: [userId, friendId] }
    });


    req.io.to(userId).emit(events.REMOVED_FRIEND_NOTIFICATION, { friendId });
    req.io.to(friendId).emit(events.REMOVED_FRIEND, { friendId: userId });
    res.status(200).json({ success: true, message: "Friend deleted and messages removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error removing friend" });
  }
});
