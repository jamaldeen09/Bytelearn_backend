import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';

const uploadRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

uploadRouter.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, msg: 'No file uploaded' });

  res.status(200).json({ success: true, url: req.file.path });
});

export default uploadRouter;
