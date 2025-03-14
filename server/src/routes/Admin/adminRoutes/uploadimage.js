import express from 'express';
import multer from 'multer';
import { uploadFileToS3 } from '../../../utils/s3Uploader.js';

const router = express.Router();
const upload = multer();

router.post('/upload-icon', upload.single('icon'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = await uploadFileToS3(req.file, 'experienceCertificate');
        res.status(200).json({ imageUrl: fileUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
