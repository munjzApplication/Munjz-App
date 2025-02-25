import mongoose from 'mongoose';


const PricingTierSchema = new mongoose.Schema({
  price: { type: String, required: true },
  currency: { type: String, required: true }
}, { _id: false });

const NotaryServicePricingSchema = new mongoose.Schema({
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'NotaryService' 
  },
  pricingTiers: {
    type: Map,
    of: PricingTierSchema
  }
}, { timestamps: true });

NotaryServicePricingSchema.index({ service: 1 });

const NotaryServicePricing = mongoose.model('NotaryServicePricing', NotaryServicePricingSchema);

export default NotaryServicePricing;
