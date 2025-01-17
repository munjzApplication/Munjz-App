import multer from 'multer';

// Store files in memory
const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size (10MB)
  },
  fileFilter: (req, file, cb) => {
    try {
      // Allowed file types (extension-based)
      const filetypes = /jpeg|jpg|png|pdf/;
      const extname = filetypes.test(file.originalname.toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      // Validate if the file type matches the allowed types
      if (extname && mimetype) {
        cb(null, true); // Accept the file
      } else {
        cb(new Error('File type not supported'), false); // Reject the file
      }
    } catch (err) {
      cb(err); // Catch any unexpected errors and pass them to the callback
    }
  },
});

// Exporting upload middleware to be used in routes
export default upload;
