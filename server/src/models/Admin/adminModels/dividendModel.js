import mongoose from "mongoose";

const dividendSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true
  },
  rates: {
    type: Map,
    of: new mongoose.Schema({
      currency: {
        type: String,
        required: true
      },
      dividend: {
        type: Number,
        required: true
      }
    }),
    required: true
  }
});

const DividendModel = mongoose.model("Dividend", dividendSchema);
export default DividendModel;
