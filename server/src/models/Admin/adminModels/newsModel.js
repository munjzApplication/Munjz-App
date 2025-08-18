import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: {
      en: { type: String, required: true }, 
      ar: { type: String, required: true }  
    },
    description: {
      en: { type: String, required: true }, 
      ar: { type: String, required: true } 
    },
  createdAt: { type: Date, required: true, default: Date.now },
  readTime: { type: String, required: true }
});

const News = mongoose.model('News', newsSchema);
export default News;
