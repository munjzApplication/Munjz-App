import News from "../../../models/Admin/adminModels/newsModel.js";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";
import { io } from "../../../socket/socketController.js";

// Get all news articles
export const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "News fetched successfully", news });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
};

// Create a news article with S3 image upload
export const createNews = async (req, res) => {
  const { titleEn, titleAr, descriptionEn, descriptionAr, readTime } = req.body;

  try {
    console.log("=== [DEBUG] Incoming Create News Request ===");
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    if (!req.file) {
      console.error("[DEBUG] No file uploaded!");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Uploaded file size (bytes):", req.file.size);

    // Enforce manual size check
    const maxFileSize = 1 * 1024 * 1024; // 1MB
    if (req.file.size > maxFileSize) {
      console.error("[DEBUG] File too large:", req.file.size);
      return res
        .status(413)
        .json({ message: "File too large. Try with another file" });
    }

    // Upload to S3
    console.log("[DEBUG] Uploading file to S3...");
    const imageUrl = await uploadFileToS3(req.file, "news-images");
    console.log("[DEBUG] File uploaded to S3:", imageUrl);

    // Construct News payload
    const payload = {
      image: imageUrl,
      title: {
        en: titleEn,
        ar: titleAr,
      },
      description: {
        en: descriptionEn,
        ar: descriptionAr,
      },
      readTime,
    };

    console.log("[DEBUG] Final News Payload before saving:", payload);

    const news = await News.create(payload);

    console.log("[DEBUG] News saved in DB with _id:", news._id);

    const customerNamespace = io.of("/customer");
    const emitData = {
      message: "News created successfully",
      data: {
        _id: news._id,
        title: news.title,
        description: news.description,
        readTime: news.readTime,
        image: news.image,
        createdAt: news.createdAt,
      },
    };

    console.log("[DEBUG] Emitting to /customer namespace:", emitData);
    customerNamespace.emit("news-created", emitData);

    res.status(201).json({ message: "News created successfully", news });
  } catch (error) {
    console.error("[DEBUG] Error in createNews:", error);
    res
      .status(400)
      .json({ message: "Failed to create news", error: error.message });
  }
};


// Update a news article with optional S3 image upload
export const updateNews = async (req, res) => {
  const { id } = req.params;
  const { titleEn, titleAr, descriptionEn, descriptionAr, readTime } = req.body;

  try {
    const updates = {
      title: { en: titleEn, ar: titleAr },
      description: { en: descriptionEn, ar: descriptionAr },
      readTime
    };

    if (req.file) {
      updates.image = await uploadFileToS3(req.file, "news-images");
    }

    const news = await News.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!news) return res.status(404).json({ message: "News article not found" });

    // Emit socket event to admins
    const adminNamespace = io.of("/admin");
    adminNamespace.emit("news-update", {
      message: "News article updated",
      data: {
        _id: news._id,
        title: news.title,
        description: news.description,
        readTime: news.readTime,
        image: news.image,
        createdAt: news.createdAt
      }
    });

    res.status(200).json({ message: "News updated successfully", news });
  } catch (error) {
    res.status(400).json({ message: "Failed to update news", error: error.message });
  }
};

// Delete a news article
export const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findByIdAndDelete(id);

    if (!news)
      return res.status(404).json({ message: "News article not found" });

    const customerNamespace = io.of("/customer");
    const emitData = {
      message: "News article deleted successfully",
      data: {
        _id: news._id
      }
    };

    customerNamespace.emit("news-deleted", emitData);
    console.log("Emitting to /customer namespace:", emitData);

    res.status(200).json({ message: "News article deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete news", error: error.message });
  }
};
