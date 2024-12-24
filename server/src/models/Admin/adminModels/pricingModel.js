import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true
  },
  parses: {
    type: Map,
    of: new mongoose.Schema({
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        required: true
      },
      minute: {
        type: Number,
        required: true
      }
    }),
    required: true
  }
});


const Pricing = mongoose.model("Pricing", pricingSchema);
export default Pricing;
