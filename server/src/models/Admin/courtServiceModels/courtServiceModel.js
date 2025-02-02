import mongoose from 'mongoose';

const CourtServiceSchema = new mongoose.Schema({
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

const CourtService =  mongoose.model('CourtService', CourtServiceSchema);
export default CourtService;
