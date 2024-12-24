import mongoose from 'mongoose';

const NotaryServiceSchema = new mongoose.Schema({
  ServiceNameArabic: { 
    type: String, 
    required: true 
  },
  ServiceNameEnglish: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });

const NotaryService =  mongoose.model('NotaryService', NotaryServiceSchema);
export default NotaryService;
