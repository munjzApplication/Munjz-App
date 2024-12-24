
import News from "../../../models/Admin/adminModels/newsModel.js";

export const getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNews = async (req, res) => {
  const { image, title, description, readTime } = req.body;

  const news = new News({
    image,
    title,
    description,
    readTime
  });

  try {
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateNews = async (req, res) => {
  const { id } = req.params;
  const { image, title, description, readTime } = req.body;

  try {
    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    news.image = image;
    news.title = title;
    news.description = description;
    news.readTime = readTime;

    await news.save();
    res.json(news);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findByIdAndDelete(id);
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }
    res.json({ message: 'News article deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};