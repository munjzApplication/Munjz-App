import mongoose from 'mongoose';

const NotaryServicePricingSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'NotaryService' 
  },
  BigPricingMaps: {
    type: Map,
    of: [String] 
  }
}, { timestamps: true });

const NotaryServicePricing = mongoose.model('NotaryService_Pricing', NotaryServicePricingSchema);

export default NotaryServicePricing;
