import multer from 'multer';
import path from 'path';

export const courseValidationSchema = {
    title: {
        notEmpty: {
            errorMessage: "A title must be provided"
        },
        isString: {
            errorMessage: "Title must be a string"
        },
    },
    description: {
        notEmpty: {
            errorMessage: "Description must not be empty"
        },
        isString: {
            errorMessage: "Description must be a string"
        }
    },
    category: {
        notEmpty: {
            errorMessage: "Category must not be empty"
        },
        isString: {
            errorMessage: "Category must be a string"
        }
    },
    isPublished: {
        notEmpty: {
            errorMessage: "A publish status must be provided"
        },
        isBoolean: {
            errorMessage: "Published status must be true/false"
        }
    },

    topics: {
        isArray: true,
        optional: true, // If quizzes can be added later
        custom: {
            options: (topics) => {
                return topics.every(topic =>
                    typeof topic.title === 'string' &&
                    Array.isArray(topic.skills) &&
                    (topic.quiz ? Array.isArray(topic.quiz) : true)
                )
            }
        }
    }
}


export const handleCourseImage = (req, res, next) => {
    // Initialize multer upload
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (validTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
        }
      }
    }).single('image');
  
    // Process the upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          msg: "File upload error",
          error: err.message,
        });
      }
  
      // Case 1: No new file uploaded, but existing URL provided
      if (!req.file && req.body.imageUrl) {
        req.courseImage = req.body.imageUrl;
        return next();
      }
  
      // Case 2: No file and no URL - only allow if it's an update (not create)
      if (!req.file && !req.body.imageUrl && req.method === 'PATCH') {
        // For updates, we'll allow keeping the existing image
        return next();
      }
  
      // Case 3: No file and no URL for new course
      if (!req.file && !req.body.imageUrl && req.method === 'POST') {
        return res.status(400).json({
          success: false,
          msg: "Either an image file or image URL is required",
        });
      }
  
      // Case 4: New file uploaded - process it
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
          {
            folder: "bytelearn_courses",
            resource_type: "auto",
            transformation: [
              { width: 1280, height: 720, crop: "fill" },
              { quality: "auto" },
            ],
          }
        );
  
        req.courseImage = uploadResult.secure_url;
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