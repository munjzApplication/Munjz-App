import mongoose from 'mongoose';

const CourtServicePricingSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'CourtService'
  },
  BigPricingMaps: {
    type: Map,
    of: [String]
  }
}, { timestamps: true });

const CourtServicePricing = mongoose.model('CourtService_Pricing', CourtServicePricingSchema);

export default CourtServicePricing;
