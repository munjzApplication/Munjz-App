import News from "../../../models/Admin/adminModels/newsModel.js";
import { formatDates } from "../../../helper/dateFormatter.js";

export const getNews = async (req, res, next) => {
  try {
    const newses = await News.find().sort({ createdAt: -1 });

    const Newses = newses.map(news => ({
      ...news._doc,
      createdAt: formatDates(news.createdAt)
    }));

    res.status(200).json({
      message: "News fetched successfully",
      data: Newses
    });
  } catch (error) {
    next(error);
  }
};
