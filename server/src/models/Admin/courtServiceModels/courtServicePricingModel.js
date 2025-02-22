import mongoose from 'mongoose';

const CourtServicePricingSchema = new mongoose.Schema({
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'NotaryService' 
  },
  pricingTiers: {
    type: Map,
    of: [String] 
  }
}, { timestamps: true });

const CourtServicePricing = mongoose.model('CourtService_Pricing', CourtServicePricingSchema);

export default CourtServicePricing;
