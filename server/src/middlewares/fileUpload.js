import multer from 'multer';

const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size (10MB)
  fileFilter: (req, file, cb) => {
    try {
      const filetypes = /jpeg|jpg|png|pdf/; // Allowed file types
      const extname = filetypes.test(file.originalname.toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      if (extname && mimetype) {
        cb(null, true); // Accept file
      } else {
        cb(new Error('File type not supported'), false); // Reject file
      }
    } catch (err) {
      cb(err); // Catch any errors
    }
  },
});

export default upload;
