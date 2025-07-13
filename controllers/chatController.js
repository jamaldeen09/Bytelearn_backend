import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js"

export const getFriends = async(req, res) => {
    try {
        if (!req.user.userId)
            return res.status(401).send({ success: false, msg: "Unauthorized Access" })

        const exsistingAcc = await User.findById(req.user.userId).populate({
            path: "friends",
            ref: "User"
        });
        
        if (!exsistingAcc)
            return res.status(404).send({ success: false, msg: "Your account does not exsist please login" })

        const friendPayload = exsistingAcc.friends.map((friend) => {
            return {
                friendName: friend.fullName,
                friendImageUrl: friend.avatar,
                isOnline: friend.isOnline,
                lastSeen: friend.lastSeen,
                bio: friend.bio,
                _id: friend._id
            }
        })


        return res.status(200).send({ success: true, payload: friendPayload })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ success: false, msg: "Server Error" })
    }
} 

export const getNotifications = async (req, res) => {
    try {
   
        if (!req.user.userId)
            return res.status(401).send({ success: false, msg: "Unauthorized Access" })

        const exsistingAcc = await User.findById(req.user.userId).populate({
            path: "notifications",
            model: "Notification",
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
       
          res.status(200).send({ success: true, notifications: exsistingAcc.notifications})
        
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

        // delete notification from notifications array of user
      const filteredNotifications = usersAcc.notifications.filter((notif) => notif.toString() !== notificationId.toString())
      usersAcc.notifications = filteredNotifications;
      await usersAcc.save();

      // delete notification from Notification Collection;
      const deletedNotif = await Notification.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(notificationId) });

      return res.status(200).send({ success: true, msg: "Notification successfully deleted", deletedNotif })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ success: false, msg: "Server Error" })
    }
}