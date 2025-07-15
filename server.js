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
import { generateFriendRequest, responseGenerator } from "./utils/utils.js";
import Notification from "./models/Notification.js";
import ChatRoom from "./models/ChatRoom.js"
import Message from "./models/Message.js"
import uploadRouter from "./routes/uploadRouter.js";

dotenv.config();

const URL = process.env.MONGO_URL;
const PORT = process.env.NEXT_PUBLIC_PORT;
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://bytelearn-online-school.onrender.com",

    ],
    credentials: true,
  }
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
    console.log("reached here")

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(socket.user.userId, { isOnline: false });
    });

    socket.on(events.JOIN_ROOM, ({ room }) => {
      socket.join(room.toString());
      console.log(currentUser.fullName, `Has joined ${room}`);
    })
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
        console.log(firstName, lastName);
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
      console.log(`Friend Status: `, isFriends)

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
    

    // Message sending
    socket.on(events.SEND_MESSAGE, async ({ receiverId, content, imageUrl }) => {
      if (!receiverId || (!content && !imageUrl)) {
        socket.emit(events.NOT_ALLOWED, responseGenerator(false, "A receiverId and content or image must be provided"))
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
        select: "senderId receiverId roomId status content imageUrl sentAt deliveredAt readAt",
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
        imageUrl: msg.imageUrl,
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
        imageUrl,
        sentAt: new Date(),
      });


      const populatedMessage = await Message.findById(newMessage._id)
        .populate('senderId', 'fullName avatar')
        .populate('receiverId', 'fullName avatar')
        .lean();

      console.log(`Populated Message's image url: `, populatedMessage.imageUrl)
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
          readAt: populatedMessage.readAt,
          imageUrl: populatedMessage.imageUrl,
        },
        room: exsistingRoom.roomId
      };
      console.log(data.message.imageUrl)


      io.to(exsistingRoom.roomId).emit(events.RECEIVED_MESSAGE, data);
    })

    socket.on(events.MARK_MESSAGES_AS_READ, async ({ roomId, friendId }) => {
      if (!roomId || !friendId) return;

      const unreadMessages = await Message.find({
        roomId,
        senderId: friendId,
        receiverId: currentUser._id,
        status: { $ne: "read" }
      });

      const readAt = new Date();

      await Message.updateMany(
        { _id: { $in: unreadMessages.map(msg => msg._id) } },
        {
          $set: {
            status: "read",
            readAt
          }
        }
      );

      socket.emit(events.MESSAGES_MARKED_AS_READ, {
        roomId,
        messages: unreadMessages.map(msg => ({
          _id: msg._id,
          content: msg.content,
          status: "read",
          readAt
        }))
      });
    });
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

