import mongoose from "mongoose";

const callActivitySchema = new mongoose.Schema({
  tapedAmount: {
    type: Number, 
    required: true,
  },
  consultantID: {
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'Consultant',
    required: true,
  },
  customerID: {
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'Customer',
    required: true,
  },
  serviceName: {
    type: String,  
    required: true,
  },
  timeDate: {
    type: Date, 
    required: true,
    default: Date.now,
  },
  activity: {
    type: String,  
    required: true,
  },
  callID: {
    type: String,  
    required: true,
    unique: true,
  },
});

const CallActivity = mongoose.model("CallActivity", callActivitySchema);
export default CallActivity;
