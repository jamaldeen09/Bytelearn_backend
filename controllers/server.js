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
import { events } from "../client/utils/events.js";
import User from "./models/User.js";
import { generateFriendRequest, responseGenerator } from "./utils/utils.js";
import Notification from "./models/Notification.js";
import ChatRoom from "./models/ChatRoom.js"
import Message from "./models/Message.js"


dotenv.config();   

const URL = process.env.MONGO_URL;
const PORT = process.env.NEXT_PUBLIC_PORT;
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
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


// `;

io.on("connection", async (socket) => {
  try {
    const currentUser = await User.findById(socket.user.userId)
    if (!currentUser) {
      socket.emit(events.NOT_FOUND, responseGenerator(false, "Account was not found"))
      return;
    }

    console.log(`${currentUser.fullName} has connected to  byteLearn website`)
    currentUser.isOnline = true;
    await currentUser.save()
    console.log("reached here")

    socket.on("disconnect", async () => {
      console.log(`${currentUser.fullName} has disconnected from byteLearn website`)
      currentUser.isOnline = false
      await currentUser.save()
    })

    socket.on(events.JOIN_ROOM, ({ room }) => {
      socket.join(room.toString());
      console.log(currentUser.fullName, `Has joined ${room}`);
    })

    socket.on(events.ADD_FRIEND, async ({ firstName, lastName }) => {
      console.log(firstName, lastName)
      const friend = await User.findOne({ fullName: `${firstName} ${lastName}` })
      if (!friend) {
        socket.emit(events.NOT_FOUND, responseGenerator(false, "Person you are trying to add does not exist"))
        return;
      }
      const currentUserIdStr = currentUser._id.toString();
      const friendIdStr = friend._id.toString();

      if (currentUserIdStr === friendIdStr) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "You cannot add yourself as a friend"));
        return;
      }

      const alreadyFriends =
        currentUser.friends.some(id => id.toString() === friendIdStr) ||
        friend.friends.some(id => id.toString() === currentUserIdStr);

      if (alreadyFriends) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, `You and ${friend.fullName} are already friends`));
        return;
      }

      if (!alreadyFriends) {

        setTimeout(() => {
          io.to(friend._id.toString()).emit(events.SEND_NOTIFICATION, responseGenerator(true, `${currentUser.fullName} sent you a friend request`));
        }, 2000)

        socket.emit(events.NEW_NOTIFICATION, responseGenerator(false, `A friend request has been sent to ${friend.fullName}`));

        // create new notification
        const notificationSent = await Notification.create({
          sender: currentUser._id,
          content: generateFriendRequest(currentUser.fullName, currentUser._id),
          receiver: friend._id,
          isSeen: false,
          sentAt: Date.now(),
          briefContent: `${currentUser.fullName} wants to be friends!`
        })
        friend.notifications.push(notificationSent._id)
        await friend.save();
        return;
      }
    })

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
          roomId: msg.roomId,
          status: msg.status,
          content: msg.content,
          sentAt: msg.sentAt,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt
        })) || []
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

    // Message sending
    socket.on(events.SEND_MESSAGE, async ({ receiverId, content }) => {
      if (!receiverId || !content) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A receiverId and content must be provided"))
        return;
      }

      // check if user exists
      const receiver = await User.findById(receiverId)
      if (!receiver) {
        socket.emit(events.NOT_FOUND, responseGenerator(false, "Receiver was not found"))
        return;
      }
      // find a room with both participants
      const exsistingRoom = await ChatRoom.findOne({
        participants: { $all: [currentUser._id, receiver._id] }
      }).populate({
        path: "messages",
        model: "Message",
        populate: [
          {
            path: "senderId",
            select: "fullName avatar"
          },
          {
            path: "receiverId",
            select: "fullName avatar"
          }
        ],
        options: { sort: { createdAt: -1 } }
      });
      if (!exsistingRoom) {
        socket.emit(events.NOT_FOUND, responseGenerator(false, "Room was not found"))
        return;
      }

      const formattedMessages = exsistingRoom.messages.map(msg => ({
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
        roomId: msg.roomId,
        status: msg.status,
        content: msg.content,
        sentAt: msg.sentAt,
        deliveredAt: msg.deliveredAt,
        readAt: msg.readAt
      }));

      socket.emit(events.MESSAGE_HISTORY, {
        roomId: exsistingRoom.roomId,
        messages: formattedMessages,
      });

      const newMessage = await Message.create({
        senderId: currentUser._id,
        receiverId,
        roomId: exsistingRoom.roomId,
        status: "sent",
        content,
        sentAt: new Date(),
      });

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('senderId', 'fullName avatar')
        .populate('receiverId', 'fullName avatar')
        .lean();

      exsistingRoom.messages.push(newMessage._id);
      await exsistingRoom.save();

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
          readAt: populatedMessage.readAt
        },
        room: exsistingRoom.roomId
      };


      io.to(exsistingRoom.roomId).emit(events.RECEIVED_MESSAGE, data);
    })
  } catch (err) {
    console.error(err)
    socket.emit(events.ERROR_OCCURED, { success: false, msg: "Server Error" })
    return;
  }
});

app.use(express.json());
app.use(passport.initialize());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(authRouter);
app.use(courseRouter);
app.use(chatRouter);

mongoose
  .connect(URL ? URL : "")
  .then(async () => {
    // const title = "Mastering JavaScript for Web Development"
    // const otherTitle = "Mastering Modern CSS Development"
    // const deleteCourse = await Course.findOneAndDelete({$and: [{title: title}, {title: otherTitle} ]})

    // console.log(deleteCourse, "has been deleted")

    // await Course.insertOne(cssMasteryCourse)
    // await Course.insertOne(pythonCourse)

    // await Course.insertOne(reactCourse)
    // console.log("react course added")
    // const deleted = await Course.findOneAndDelete({ title: "Mastering React.js: From Fundamentals to Advanced Patterns" })
    // console.log(deleted)
    // console.log("Added new course")

    // const deleted = await User.deleteOne({ fullName: "Jamal Omotoyosi" })
    // const omotoyosi = await User.deleteOne({ fullName: "Olatunji Omotoyosi" })
    // const distopian = await User.deleteOne({ fullName: "disptopian disto" })
    // // console.log(deleted)
    // // console.log(omotoyosi)
    // console.log(distopian)

    server.listen(PORT, () =>
      console.log(`Server is running on port http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error(err);
  });

