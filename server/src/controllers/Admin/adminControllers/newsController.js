import News from "../../../models/Admin/adminModels/newsModel.js";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";

// Get all news articles
export const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 }); // Sorted by newest first
    res.status(200).json({ message: "News fetched successfully", news });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
};

// Create a news article with S3 image upload
export const createNews = async (req, res) => {
  const { title, description, readTime } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload a single file to S3 and get its URL
    const imageUrl = await uploadFileToS3(req.file);

    const news = await News.create({ images: imageUrl, title, description, readTime });
    res.status(201).json({ message: 'News created successfully', news });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create news', error: error.message });
  }
};

// Update a news article with optional S3 image upload
export const updateNews = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (req.file) {
      // Upload a single file to S3 and get its URL
      updates.images = await uploadFileToS3(req.file);
    }

    const news = await News.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!news) return res.status(404).json({ message: 'News article not found' });

    res.status(200).json({ message: 'News updated successfully', news });
  } catch (error) {
    res.status(400).json({ message: "Failed to update news", error: error.message });
  }
};


// Delete a news article
export const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findByIdAndDelete(id);
    if (!news) return res.status(404).json({ message: 'News article not found' });

    res.status(200).json({ message: 'News article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete news", error: error.message });
  }
};
