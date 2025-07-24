import { createAccessToken, forgotPassToken } from "../middlewares/auth.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import { generateHTML } from "../utils/utils.js"


// node mailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.mail.yahoo.com", // Yahoo's SMTP server
  port: 465, // Secure port
  secure: true, // SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.YAHOO_APP_PASSWORD,
  },
});

const generateOTP = () => {
  const generatedOTP = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true
  });

  return generatedOTP;
};

export const googleAuth = async (req, res) => {
  try {
    const user = req.user;

    const token = createAccessToken(user._id);
    res.redirect(`https://bytelearn-online-school.onrender.com/client/auth/success?token=${token}`);
  } catch (error) {
    console.error(error);
    res.redirect(`https://bytelearn-online-school.onrender.com/client/auth/login`);
  }
};

export const googleRedirect = async (req, res) => {
  try {
    const user = req.user;

    const token = createAccessToken(user._id);
    res.redirect(`https://bytelearn-online-school.onrender.com/client/auth/success?token=${token}`);
  } catch (error) {
    console.error(error);
    res.redirect("https://bytelearn-online-school.onrender.com/client/auth/login");
  }
};

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.data;

    // check if users account exists
    const exsistingAcc = await User.findOne({
      $or: [{ fullName: `${firstName} ${lastName}` }, { email }],
    });
    if (exsistingAcc)
      return res
        .status(406)
        .send({
          success: false,
          msg: "Account already exsists. Please log in",
        });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      fullName: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
    });
    if (!newUser)
      return res
        .status(500)
        .send({ success: false, msg: "Account creation failed" });

    const accessToken = createAccessToken(newUser._id);
    return res
      .status(201)
      .send({ success: true, msg: "Account created", token: accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.data;
    const otp = generateOTP();

    const exsistingEmail = await User.findOneAndUpdate(
      { email },
      { $set: { generatedOtp: otp.toString() } }
    );
    if (!exsistingEmail)
      return res
        .status(404)
        .send({
          success: false,
          msg: "If this email exists, a reset link has been sent",
        });

    await transporter.sendMail({
      from: `"ByteLearn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}`,
      html: `
        ${generateHTML(otp)}
      `,
    });

    const passwordResetToken = forgotPassToken(exsistingEmail._id);
    return res
      .status(200)
      .send({
        success: true,
        msg: "OTP has been sent. It expires in 5 minutes",
        passwordResetToken,
      });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server Error" });
  }
};

export const otpVerification = async (req, res) => {
  try {
    const { otp } = req.data;
    // compare otps
    const isValidOtp = await User.findById(req.forgotPassId);
    if (!isValidOtp)
      return res.status(404).send({ success: false, msg: "Account was not found" });

    const compare = isValidOtp.generatedOtp === otp.toString();
    if (!compare)
      return res.status(406).send({ success: false, msg: "Invalid OTP" });

    return res.status(200).send({ success: true, msg: "OTP is valid" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    if (!req.forgotPassId)
      return res
        .status(401)
        .send({ success: false, msg: "Password reset token needed" });

    const { password } = req.data;
    const hashedNewPassword = await bcrypt.hash(password, 12);
    

    // check if user is valid;
    const exsistingUser = await User.findByIdAndUpdate(
      req.forgotPassId,
      { $set: { password: hashedNewPassword, generatedOtp: null } },
      { new: true }
    );
    if (!exsistingUser)
      return res
        .status(404)
        .send({ success: false, msg: "Account was not found" });

    if (!exsistingUser.password){
      return res.status(400).send({ success: false, msg: "Your account is an Oauth account, password cannot be changed. Please log in" })
    }
    
    return res
      .status(200)
      .send({ success: true, msg: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.data

    // check for account

    const exsistingAcc = await User.findOne({ email })
    if (!exsistingAcc)
      return res.status(404).send({ success: false, msg: "Account was not found. Please sign up" })

    const accessToken = createAccessToken(exsistingAcc._id)
    if (!exsistingAcc.password) {
      return res.status(200).send({
        success: true,
        msg: "Login successful (OAuth account)",
        token: accessToken,
      });
    }
    
    // check if credentials are valid
    const isValidPassword = await bcrypt.compare(password, exsistingAcc.password);
    if (!isValidPassword)
      return res.status(406).send({ success: false, msg: "Invalid credentials" })
    
    return res.status(200).send({ success: true, msg: "Account found", token: accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, msg: "Server Error" });
  }
}


export const verifyUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).send({ success: false, msg: "Unauthorized Access" });
    }

  
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).send({ success: false, msg: "Invalid token payload" });
    }

    const exsistingAcc = await User.findById(userId)
      .populate({
        path: "createdCourses",
        model: "Course",
        populate: { path: "creator", model: "User" }
      })
      .populate({
        path: "enrolledCourses",
        model: "Course",
        populate: { path: "creator", model: "User" }
      });
 
    if (!exsistingAcc)
      return res.status(404).send({ success: false, msg: "Account was not found" })

    const payload = {
      email: exsistingAcc.email,
      fullName: exsistingAcc.fullName,
      friends: exsistingAcc.friends,
      createdCourses: exsistingAcc.createdCourses,
      enrolledCourses: exsistingAcc.enrolledCourses,
      _id: exsistingAcc._id,
      bio: exsistingAcc.bio,
      avatar: exsistingAcc.avatar
    }
    

    return res.status(200).send({ success: true, msg: "Account found", payload })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ success: false, msg: "Server Error" })
  }
}
export const getUsers = async (req, res) => {
  return res.json({ users: await User.find() });
};


export const changeAvatar = async (req, res) => {
  try {
    if (!req.user.userId || !req.avatarUrl) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: req.avatarUrl },
      { new: true }
    ).select("avatar");

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      msg: "Avatar updated successfully",
      avatarUrl: user.avatar
    });
  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error during avatar update"
    });
  }
};