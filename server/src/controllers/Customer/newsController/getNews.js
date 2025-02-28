import News from "../../../models/Admin/adminModels/newsModel.js";
import { formatDates } from "../../../helper/dateFormatter.js";

export const getNews = async (req, res, next) => {
    try {
        const newses = await News.find();

        // Format the createdAt field for each news item
        const Newses = newses.map(news => ({
            ...news._doc, // Spread existing data
            createdAt: formatDates(news.createdAt) // Format the date
        }));

        res.status(200).json({ 
            message: "News fetched successfully", 
            data: Newses 
        });
    } catch (error) {
        next(error);
    }
};
