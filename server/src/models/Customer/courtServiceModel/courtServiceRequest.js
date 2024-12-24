import mongoose from 'mongoose';

const CourtServiceRequestSchema = new mongoose.Schema({
  courtServiceID: {
    type: String,
    unique: true,
  },
  serviceName: String,
  selectedServiceCountry: String,
  requesterEmail: String,

}, { timestamps: true });

export default mongoose.model('CourtService_Request', CourtServiceRequestSchema);
