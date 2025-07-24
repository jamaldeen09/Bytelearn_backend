import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";
import "./config/passport.js";
import { courseRouter } from "./routes/courseRouter.js";
import { chatRouter } from "./routes/chatRouter.js";
import jwt from "jsonwebtoken";
import { events } from "./utils/events.js";
import User from "./models/User.js";
import { formatTimeAgo, generateFriendRequest, responseGenerator } from "./utils/utils.js";
import Notification from "./models/Notification.js";
import ChatRoom from "./models/ChatRoom.js"
import Message from "./models/Message.js"
import uploadRouter from "./routes/uploadRouter.js";
import { cssMasteryCourse, exampleCourse, pythonCourse, reactCourse } from "./data/courseData.js";
import Course from "./models/Course.js";
import FeedbackRoom from "./models/FeedbackRoom.js";
import Progress from "./models/Progress.js";
import FeedbackMessage from "./models/FeedbackMessage.js";
import aiRouter from "./routes/aiRouter.js";
import bcrypt from "bcrypt"

dotenv.config();

const URL = process.env.MONGO_URL;
const PORT = process.env.PORT|| 10000;
const app = express();
const server = http.createServer(app);

server.keepAliveTimeout = 120000
server.headersTimeout = 120000

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://bytelearn-online-school.onrender.com",

    ],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000
});



io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.emit("unauthorized-access", {
      success: false,
      msg: "Unauthorized access",
    });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      socket.emit("invalid-token", {
        success: false,
        msg: "Token is not Valid",
      });
      return;
    } else {
      socket.user = decoded;
      next();
    }
  });
});


io.on("connection", async (socket) => {
  try {
    const currentUser = await User.findById(socket.user.userId)
    if (!currentUser) {
      socket.emit(events.NOT_FOUND, responseGenerator(false, "Account was not found"))
      return;
    }


    console.log(`${currentUser.fullName} has connected to  byteLearn website`)
    await User.findByIdAndUpdate(socket.user.userId, { isOnline: true });


    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(socket.user.userId, { isOnline: false });
    });

    socket.on(events.JOIN_ROOM, ({ room }) => {
      socket.join(room.toString());
      console.log(currentUser.fullName, `Has joined ${room}`);
    })
    socket.on(events.JOIN_COURSE_ROOM, ({ room }) => {
      socket.join(room);
      console.log(`${socket.user.userId} joined feedback room: ${room}`);
    });
    socket.on(events.LEAVE_COURSE_ROOM, ({ room }) => {
      socket.leave(room);
      console.log(`${socket.user.userId} left feedback room: ${room}`);
    });

    socket.on(events.TYPING, ({ receiverId }) => {
      socket.to(receiverId.toString()).emit(events.TYPING, {
        senderId: socket.user.userId,
      });
    });

    socket.on(events.STOP_TYPING, ({ receiverId }) => {
      console.log(`${socket.user.userId} is typing to ${receiverId}`);
      socket.to(receiverId.toString()).emit(events.STOP_TYPING, {
        senderId: socket.user.userId,
      });
    });

    socket.on(events.ADD_FRIEND, async ({ firstName, lastName }) => {
      try {

        const friend = await User.findOne({ fullName: `${firstName} ${lastName}` });

        if (!friend) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "Person you are trying to add does not exist"));
          return;
        }

        // Ensure both users are populated with their friends lists
        const populatedCurrentUser = await User.findById(currentUser._id).populate('friends');
        const populatedFriend = await User.findById(friend._id).populate('friends');

        const currentUserIdStr = currentUser._id.toString();
        const friendIdStr = friend._id.toString();

        if (currentUserIdStr === friendIdStr) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, "You cannot add yourself as a friend"));
          return;
        }

        // Check if friendship already exists (only need to check one side)
        const alreadyFriends = populatedCurrentUser.friends.some(f =>
          f._id.toString() === friendIdStr
        );

        if (alreadyFriends) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, `You and ${friend.fullName} are already friends`));
          return;
        }

        // Send notification
        setTimeout(() => {
          io.to(friend._id.toString()).emit(
            events.SEND_NOTIFICATION,
            responseGenerator(true, `${currentUser.fullName} sent you a friend request`)
          );
        }, 2000);

        socket.emit(events.NEW_NOTIFICATION,
          responseGenerator(false, `A friend request has been sent to ${friend.fullName}`)
        );

        // Create new notification
        const notificationSent = await Notification.create({
          sender: currentUser._id,
          content: generateFriendRequest(currentUser.fullName, currentUser._id),
          receiver: friend._id,
          isSeen: false,
          sentAt: Date.now(),
          briefContent: `${currentUser.fullName} wants to be friends!`
        });

        populatedFriend.notifications.push(notificationSent._id);
        await populatedFriend.save();

      } catch (error) {
        console.error("Error in ADD_FRIEND:", error);
        socket.emit(events.ERROR_OCCURED, responseGenerator(false, "Failed to process friend request"));
      }
    });

    // seen notification
    socket.on(events.SEEN_NOTIFICATION, async ({ notifId }) => {
      if (!notifId) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Notification ID must be proivided"))
        return;
      }
      // find notification
      const foundNotification = await Notification.findById(notifId).populate({
        path: "sender",
        model: "User",
        select: "email fullName avatar"
      });
      const data = {
        success: true,
        notifSender: {
          fullName: foundNotification.sender.fullName,
          avatar: foundNotification.sender.avatar,
          email: foundNotification.sender.email,
          content: foundNotification.content
        },
      }
      if (!foundNotification) {

        socket.emit(events.NOT_FOUND, responseGenerator(false, "Notification was not found"))
        return;
      }

      if (foundNotification.isSeen) {

        socket.emit(events.NOT_ALLOWED, data);
        return;
      }

      foundNotification.isSeen = true;
      await foundNotification.save();


      socket.emit(events.CHANGED_TO_SEEN, data);
    })

    socket.on(events.ACCEPT_FRIEND_REQUEST, async ({ senderId, notificationId }) => {
      if (!senderId || !notificationId) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Please provide a senderId and notificationId"))
        return;
      }
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, receiver: socket.user.userId },
        {
          requestStatus: "accepted",
          isSeen: true,
          content: generateFriendRequest(
            currentUser.fullName,
            senderId,
            "accepted"
          )
        },
        { new: true }
      ).populate("sender", "fullName avatar email");

      if (!notification) {
        socket.emit(events.NOT_FOUND, {
          success: false,
          message: "Notification not found or unauthorized"
        });
        return;
      }

      // 3. Add friend relationship (both directions)
      await User.findByIdAndUpdate(socket.user.userId, {
        $addToSet: { friends: senderId }
      });
      await User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: socket.user.userId }
      });

      // 4. Notify both users
      const updatedNotification = await Notification.findById(notificationId)
        .populate("sender", "fullName avatar email");

      socket.emit(events.FRIEND_REQUEST_ACCEPTED, {
        success: true,
        notification: updatedNotification
      });

      io.to(senderId.toString()).emit(events.FRIEND_REQUEST_ACCEPTED_NOTIFICATION, {
        success: true,
        message: `${currentUser.fullName} accepted your friend request!`,
        notification: updatedNotification
      });

    })


    socket.on(events.REJECT_FRIEND_REQUEST, async ({ senderId, notificationId }) => {
      if (!senderId || !notificationId) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Please provide a senderId and notificationId"));
        return;
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, receiver: socket.user.userId },
        {
          requestStatus: "rejected",
          isSeen: true,
          content: generateFriendRequest(
            currentUser.fullName,
            senderId,
            "rejected"
          )
        },
        { new: true }
      ).populate("sender", "fullName avatar email");

      if (!notification) {
        socket.emit(events.NOT_FOUND, {
          success: false,
          message: "Notification not found or unauthorized"
        });
        return;
      }

      // Notify both users
      const updatedNotification = await Notification.findById(notificationId)
        .populate("sender", "fullName avatar email");

      socket.emit(events.FRIEND_REQUEST_REJECTED, {
        success: true,
        notification: updatedNotification
      });

      io.to(senderId.toString()).emit(events.FRIEND_REQUEST_REJECTED_NOTIFICATION, {
        success: true,
        message: `${currentUser.fullName} declined your friend request`,
        notification: updatedNotification
      });
    });

    socket.on(events.CREATE_ROOM, async ({ roomId, participantId }) => {
      if (!roomId || !participantId) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A roomId and a participant id must be provided"))
        return;
      }


      // validate friend id
      const friend = await User.findById(participantId)
      if (!friend) {
        socket.emit(events.NOT_FOUND, responseGenerator(false, "Friend was not found"));
        return;
      }


      const isFriends = currentUser.friends.some((usersFriend) =>
        usersFriend._id.toString() === friend._id.toString()
      );


      if (!isFriends) {
        const data = { isFriends: false };
        socket.emit(events.NO_LONGER_FRIENDS, data);
        return;
      }

      const isExsistingRoom = await ChatRoom.findOne({
        $and: [
          { participants: { $all: [currentUser._id, friend._id] } },
          { participants: { $size: 2 } }
        ]
      }).populate({
        path: "messages",
        populate: [
          { path: "senderId", select: "fullName avatar" },
          { path: "receiverId", select: "fullName avatar" }
        ]
      });



      const data = {
        information: {
          _id: friend._id.toString(),
          fullName: friend.fullName,
          isOnline: friend.isOnline,
          avatar: friend.avatar,
          bio: friend.bio,
        },
        messages: isExsistingRoom?.messages?.map(msg => ({
          _id: msg._id,
          sender: {
            _id: msg.senderId._id,
            fullName: msg.senderId.fullName,
            avatar: msg.senderId.avatar
          },
          receiver: {
            _id: msg.receiverId._id,
            fullName: msg.receiverId.fullName,
            avatar: msg.receiverId.avatar
          },
          imageUrl: msg.imageUrl,
          roomId: msg.roomId,
          status: msg.status,
          content: msg.content,
          sentAt: msg.sentAt,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt
        })) || [],
        roomId: isExsistingRoom?.roomId?.toString() || roomId,
      };

      if (isExsistingRoom) {
        socket.join(isExsistingRoom.roomId.toString())
        socket.emit(events.CHATROOM_FOUND, data)
        return;
      } else {

        const newRoom = await ChatRoom.create(
          {
            participants: [currentUser._id, friend._id],
            roomId: roomId,
            messages: [],
            createdAt: Date.now()
          }
        )

        socket.join(newRoom.roomId.toString())
        socket.emit(events.CHATROOM_CREATED, data);
        return;
      }
    })

    socket.on(events.SEND_MESSAGE, async ({ receiverId, content, imageUrl }) => {
      try {
        if (!receiverId || (!content && !imageUrl)) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A receiverId and content or image must be provided"));
          return;
        }

        // Check if user exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "Receiver was not found"));
          return;
        }

        // Find room with both participants
        const existingRoom = await ChatRoom.findOne({
          participants: { $all: [currentUser._id, receiver._id] }
        });

        if (!existingRoom) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "Room was not found"));
          return;
        }

        // Create new message
        const newMessage = await Message.create({
          senderId: currentUser._id,
          receiverId,
          roomId: existingRoom.roomId,
          status: "sent",
          content,
          imageUrl,
          sentAt: new Date(),
        });

        // Add message to room
        existingRoom.messages.push(newMessage._id);
        await existingRoom.save();

        // Populate message for sending to clients
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'fullName avatar')
          .populate('receiverId', 'fullName avatar')
          .lean();

        const data = {
          message: {
            _id: populatedMessage._id,
            sender: {
              _id: populatedMessage.senderId._id,
              fullName: populatedMessage.senderId.fullName,
              avatar: populatedMessage.senderId.avatar
            },
            receiver: {
              _id: populatedMessage.receiverId._id,
              fullName: populatedMessage.receiverId.fullName,
              avatar: populatedMessage.receiverId.avatar
            },
            roomId: populatedMessage.roomId,
            status: populatedMessage.status,
            content: populatedMessage.content,
            sentAt: populatedMessage.sentAt,
            deliveredAt: populatedMessage.deliveredAt,
            readAt: populatedMessage.readAt,
            imageUrl: populatedMessage.imageUrl,
          },
          room: existingRoom.roomId
        };


        io.to(existingRoom.roomId).emit(events.RECEIVED_MESSAGE, data);

      } catch (error) {
        console.error("Error in SEND_MESSAGE:", error);
        socket.emit(events.ERROR_OCCURED, responseGenerator(false, "Failed to send message"));
      }
    });

    socket.on(events.MARK_MESSAGES_AS_READ, async ({ roomId, friendId }) => {
      if (!roomId || !friendId) return;

      const currentUserId = socket.user.userId;


      await Message.updateMany(
        {
          senderId: friendId,
          receiverId: currentUserId,
          status: { $ne: "read" }
        },
        {
          $set: {
            status: "read",
            readAt: new Date()
          }
        }
      );

      // Notify both clients
      io.to(roomId).emit(events.MESSAGES_MARKED_AS_READ, {
        friendId // Only need to send friendId now
      });
    });


    socket.on(events.SEND_FEEDBACK, async ({ courseId, msg }) => {
      if (!courseId || !msg) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A course Id and a message must be provided"));
        return;
      }

      const foundFeedbackRoom = await FeedbackRoom.findOneAndUpdate({ course: courseId })

      if (!foundFeedbackRoom) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Feedback room was not found"));
        return;
      }
      const messagePayload = {
        feedbackRoom: foundFeedbackRoom._id,
        sender: await User.findById(socket.user.userId),
        content: msg,
      }

      const newMessage = await FeedbackMessage.create(messagePayload);
      const editWindowDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
      const editWindowEnd = new Date(Date.now() + editWindowDuration);

      newMessage.editWindow = editWindowEnd
      await newMessage.save()

      foundFeedbackRoom.messages.push(newMessage._id);
      await foundFeedbackRoom.save();


      const messageSentToFrontend = await FeedbackMessage.findById(newMessage).populate({
        path: "sender",
        model: "User",
        select: "fullName avatar",
      })

      const payload = {
        _id: messageSentToFrontend._id,
        sender: {
          fullName: messageSentToFrontend.sender.fullName,
          profilePicture: messageSentToFrontend.sender.avatar
        },
        text: messageSentToFrontend.content,
        createdAt: formatTimeAgo(new Date(messageSentToFrontend.createdAt)),
        isEdited: msg?.isEdited,
        editedAt: msg?.editedAt,
        editWindow: msg?.editWindow
      }
      const room = `feedback-${foundFeedbackRoom.course}`;
      io.to(room).emit(events.FEEDBACK_SENT, payload);
    })

    // Feedback history
    socket.on(events.GET_FEEDBACK_HISTORY, async ({ courseId }) => {
      if (!courseId) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A course Id must be provided"));
        return;
      }

      const foundFeedbackRoom = await FeedbackRoom.findOneAndUpdate({ course: courseId }).populate({
        path: "messages",
        model: "FeedbackMessage",
        populate: {
          path: "sender",
          model: "User",
          select: "fullName avatar"
        }
      });

      if (!foundFeedbackRoom) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Feedback room was not found"));
        return;
      }

      socket.join(foundFeedbackRoom.course._id)
      const payload = foundFeedbackRoom.messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((msg) => ({
          _id: msg._id,
          sender: {
            _id: msg.sender?._id,
            fullName: msg.sender?.fullName,
            profilePicture: msg.sender?.avatar
          },
          text: msg?.content,
          createdAt: msg?.createdAt,
          isEdited: msg?.isEdited,
          editedAt: msg?.editedAt,
          editWindow: msg?.editWindow,
          likes: msg?.likes || 0,
          likedBy: msg?.likedBy || []
        })) || [];
      socket.emit(events.FEEDBACK_HISTORY_SENT, payload)
    })

    socket.on(events.DELETE_FEEDBACK_MESSAGE, async ({ courseId }) => {

      try {
        if (!courseId) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Course id must be provided"));
          return;
        }

        let foundFeedbackRoom = await FeedbackRoom.findOne({ course: new mongoose.Types.ObjectId(courseId) }).populate({
          path: "messages",
          model: "FeedbackMessage",
        })

        if (!foundFeedbackRoom) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "FeedbackRoom was not found"));
          return;
        }

        const currUser = await User.findById(socket.user.userId);
        const foundFeedbackMessage = foundFeedbackRoom.messages.find((msg) => msg.sender._id.equals(currUser._id));


        foundFeedbackRoom.messages = foundFeedbackRoom.messages.filter((msg) => msg !== foundFeedbackMessage);
        await foundFeedbackRoom.save();

        socket.emit(events.DELETED_FEEDBACK_MESSAGE, responseGenerator(true, "Feedback message deleted"));
      } catch (err) {
        console.error(err)
        socket.emit(events.ERROR_OCCURED, responseGenerator(false, "Server error"))
      }
    })

    socket.on(events.EDIT_MESSAGE, async ({ msgToEdit, courseId, newContent }) => {
      try {
        if (!msgToEdit || !courseId || !newContent) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Please provide a message id a course id and some new content for the message"));
          return;
        }

        let foundFeedbackRoom = await FeedbackRoom.findOne({ course: new mongoose.Types.ObjectId(courseId) }).populate({
          path: "messages",
          model: "FeedbackMessage",
        })

        let messageToEdit = foundFeedbackRoom.messages.find((msg) => msg._id.equals(msgToEdit));


        if (!messageToEdit) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "The message you are trying to edit does not exist"));
          return;
        }

        const now = new Date();
        const editWindowExpired = messageToEdit.editWindow &&
          now > new Date(messageToEdit.editWindow);

        if (editWindowExpired) {
          socket.emit(events.NOT_ALLOWED,
            responseGenerator(false, "Edit window has expired")
          );
          return;
        }

        // Initialize edit window if this is the first edit
        if (!messageToEdit.editWindow) {
          const editWindowDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
          messageToEdit.editWindow = new Date(now.getTime() + editWindowDuration);
        }

        messageToEdit.content = newContent;
        messageToEdit.isEdited = true;
        messageToEdit.editedAt = Date.now();

        await messageToEdit.save()
        await foundFeedbackRoom.save();

        socket.emit(events.MESSAGE_EDITED, responseGenerator(true, "Message Edited"));
      } catch (err) {
        console.error(err)
        socket.emit(events.ERROR_OCCURED, responseGenerator(false, "Server error"))
      }
    })

    socket.on(events.LIKE_FEEDBACK_MESSAGE, async ({ messageId, courseId, userId, like }) => {
      try {
        // 1. Input Validation
        if (!messageId || !courseId || !userId || typeof like !== 'boolean') {
          socket.emit(events.INVALID_INPUT, responseGenerator(false, "Invalid input parameters"));
          return;
        }

        // 2. Find the feedback message with proper error handling
        const message = await FeedbackMessage.findById(messageId).lean();
        if (!message) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "Message not found"));
          return;
        }

        // 3. Verify user exists
        const user = await User.findById(userId).select('_id').lean();
        if (!user) {
          socket.emit(events.NOT_FOUND, responseGenerator(false, "User not found"));
          return;
        }

        // 4. Convert likedBy to ObjectId for comparison
        const likedByObjectIds = message.likedBy.map(id => id.toString());
        const alreadyLiked = likedByObjectIds.includes(user._id.toString());


        const update = {
          $inc: { likes: like ? 1 : -1 },
          [like ? '$addToSet' : '$pull']: { likedBy: user._id }
        };

        // 6. Prevent negative like counts
        if (!like && message.likes <= 0) {
          socket.emit(events.NOT_ALLOWED, responseGenerator(false, "Like count cannot be negative"));
          return;
        }

        // 7. Atomic update operation
        const updatedMessage = await FeedbackMessage.findByIdAndUpdate(
          messageId,
          update,
          { new: true }
        );

        // 8. Broadcast update to room
        const room = `feedback-${courseId}`;
        io.to(room).emit(events.FEEDBACK_MESSAGE_LIKED, {
          messageId,
          likes: updatedMessage.likes,
          liked: like,
          userId: user._id
        });

      } catch (err) {
        console.error("Error in LIKE_FEEDBACK_MESSAGE:", err);
        socket.emit(events.ERROR_OCCURED, responseGenerator(false, "Failed to process like action"));
      }
    })
  } catch (err) {
    console.error(err)
    socket.emit(events.ERROR_OCCURED, { success: false, msg: "Server Error" })
    return;
  }
});

app.use(express.json());
app.use(passport.initialize());
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(cors({
  origin: ["https://bytelearn-online-school-frontend.vercel.app", "http://localhost:3000", "https://bytelearn-online-school.onrender.com"],
  credentials: true
}))
app.use(authRouter);
app.use(courseRouter);
app.use(chatRouter);
app.use(uploadRouter);
app.use(aiRouter)

mongoose
  .connect(URL ? URL : "")
  .then(async () => {

    //  const updatedCount = await Course.updateMany({
    //    peopleEnrolled: {$exists: false}
    //  }, {
    //   $set: {  peopleEnrolled: [] }
    //  })

    // await User.deleteOne({fullName: "Jubril Olatunji"})

    // const react = new mongoose.Types.ObjectId("6877a95052627f399ca7b3a6")
    // const javascript = await Course.findOne({ title: "Mastering JavaScript for Web Development" })
  
    // // const python = new mongoose.Types.ObjectId("6877a95152627f399ca7b3b3")
    // const jamal = new mongoose.Types.ObjectId("6882a1c72715b1f8fce40680")

    // // // await Course.findOneAndUpdate({ _id: react }, { $set: {creator: jamal }})
    // // await Course.findOneAndUpdate({ _id: javascript._id }, { $set: {creator: jamal }})
    // // // await Course.findOneAndUpdate({ _id: python }, { $set: {creator: jamal }})

 
    // const css = await Course.findOne({ title: "Mastering Modern CSS Development" })
    
    // css.creator = jamal;
    // await css.save()

    //    await User.findOneAndUpdate({ _id: jamal }, { $push: {createdCourses: css._id } })

    server.listen(PORT, "0.0.0.0", () =>
      console.log(`Server is running on port http://localhost:${PORT}`)
    );

  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

