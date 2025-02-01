import mongoose from 'mongoose';

const NotaryServiceSchema = new mongoose.Schema({
  serviceNo: { 
    type: Number, 
    unique: true, 
    required: true 
  },
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
