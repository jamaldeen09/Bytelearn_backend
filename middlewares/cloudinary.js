import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const cloudUploadMiddleware = (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        msg: "File upload error",  
        error: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "No image file provided",
      });
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "bytelearn_avatars",
          resource_type: "auto",
          transformation: [
            { width: 200, height: 200, crop: "fill" },
            { quality: "auto" },
          ],
        }
      );

      req.avatarUrl = uploadResult.secure_url;
      next();
    } catch (error) {
      console.error("Cloudinary error:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to upload image to Cloudinary",
      });
    }
  });
};
   