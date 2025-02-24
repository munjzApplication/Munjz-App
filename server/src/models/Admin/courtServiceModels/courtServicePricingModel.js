import mongoose from 'mongoose';

const PricingTierSchema = new mongoose.Schema({
  price: { type: String, required: true },
  currency: { type: String, required: true }
}, { _id: false });

const CourtServicePricingSchema = new mongoose.Schema({
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'CourtService' 
  },
  pricingTiers: {
    type: Map,
    of: PricingTierSchema
  }
}, { timestamps: true });

CourtServicePricingSchema.index({ service: 1 });

const CourtServicePricing = mongoose.model('CourtService_Pricing', CourtServicePricingSchema);

export default CourtServicePricing;
