import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  images: { type: [String], required: true }, 
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  readTime: { type: String, required: true }
});

const News = mongoose.model('News', newsSchema);
export default News;
