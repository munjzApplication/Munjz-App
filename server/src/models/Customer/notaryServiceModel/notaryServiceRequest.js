import mongoose from 'mongoose';

const NotaryServiceRequestSchema = new mongoose.Schema({
  notaryServiceID: {
    type: String,
    unique: true,
  },
  serviceName: String,
  selectedServiceCountry: String,
  requesterEmail: String,

}, { timestamps: true });

export default mongoose.model('NotaryService_Request', NotaryServiceRequestSchema);
