import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js"
import Message from "../models/Message.js";


export const getFriends = async (req, res) => {
    try {
        if (!req.user.userId)
            return res.status(401).send({ success: false, msg: "Unauthorized Access" })

        const exsistingAcc = await User.findById(req.user.userId).populate({
            path: "friends",
            ref: "User",
            populate: {
                path: "friends",
                model: "User"
            }
        });

        if (!exsistingAcc)
            return res.status(404).send({ success: false, msg: "Your account does not exsist please login" })



        const friends = exsistingAcc.friends;
        const lastMessages = await Promise.all(
            friends.map(async (friend) => {
                const message = await Message.findOne({
                    $or: [
                        { senderId: req.user.userId, receiverId: friend._id },
                        { senderId: friend._id, receiverId: req.user.userId }
                    ]
                })
                    .sort({ sentAt: -1 })
                    .limit(1);

                return {
                    friendId: friend._id,
                    lastMessage: message,
                };
            })
        );
        const friendPayload = friends.map((friend) => {
            const lastMessageEntry = lastMessages.find((entry) =>
                entry.friendId.toString() === friend._id.toString()
            );

            return {
                friendName: friend.fullName,
                friendImageUrl: friend.avatar,
                isOnline: friend.isOnline,
                lastSeen: friend.lastSeen,
                bio: friend.bio,
                _id: friend._id,
                lastMessage: lastMessageEntry?.lastMessage || null,
            };
        });

        return res.status(200).send({ success: true, payload: friendPayload })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ success: false, msg: "Server Error" })
    }
}

export const getNotifications = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).send({ success: false, msg: "Unauthorized Access" });
        }
       
        const exsistingAcc = await User.findById(req.user.userId).populate({
            path: "notifications",
            model: "Notification",
            options: { 
              sort: { sentAt: -1 } 
            },
            populate: [
              {
                path: "sender",
                model: "User",
                select: "fullName avatar email"
              },
              {
                path: "receiver",
                model: "User",
                select: "fullName avatar email"
              }
            ]
          });



        res.status(200).send({ success: true, notifications: exsistingAcc.notifications })

    } catch (err) {
        console.error(err)
        return res.status(500).send({ success: false, msg: "Server Error" })
    }
}

export const deleteNotification = async (req, res) => {
    try {
        if (!req.user.userId)
            return res.status(401).send({ success: false, msg: "Unauthorized Access" })

        const { notificationId } = req.data;

        const usersAcc = await User.findById(req.user.userId)
        if (!usersAcc)
            return res.status(404).send({ success: false, msg: "Account was not found" })


        const filteredNotifications = usersAcc.notifications.filter((notif) => notif.toString() !== notificationId.toString())
        usersAcc.notifications = filteredNotifications;
        await usersAcc.save();


        const deletedNotif = await Notification.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(notificationId) });

        return res.status(200).send({ success: true, msg: "Notification successfully deleted", deletedNotif })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ success: false, msg: "Server Error" })
    }
}

export const getUnreadMessages = async (req, res) => {
    
    try {
      if (!req.user.userId)
        return res.status(400).send({ success: false, msg: "Unauthorized access" });
  
      const unreadMessages = await Message.find({
        receiverId: req.user.userId,
        status: { $ne: "read" }
      }).populate('senderId', 'fullName avatar _id');
  
      // Group by sender
      const unreadCounts = unreadMessages.reduce((acc, msg) => {
        const senderId = msg.senderId._id.toString();
        acc[senderId] = (acc[senderId] || 0) + 1;
        return acc;
      }, {});
      const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  
      res.status(200).json({ 
        success: true, 
        unreadCounts,
        totalUnread,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error fetching unread messages" });
    }
};

export const clearNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId)
            return res.status(401).send({ success: false, msg: "Unauthorized Access" })

        const user = await User.findByIdAndUpdate(userId, {$set: {notifications: []}}, {new: true});

        if (!user)
            return res.status(404).send({ success: false, msg: "Your account was not found" })

        return res.status(200).send({ success: true, msg: "Notifications have been cleared successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error occured in clearing notifications" });
    }
}
