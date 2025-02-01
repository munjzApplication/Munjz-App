import mongoose from 'mongoose';

const NotaryServicePricingSchema = new mongoose.Schema({
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

const NotaryServicePricing = mongoose.model('NotaryServicePricing', NotaryServicePricingSchema);

export default NotaryServicePricing;
