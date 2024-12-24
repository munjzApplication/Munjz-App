import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  customerId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer_Profile", 
    
  },
    balance: {
      type: Number,
      required: true,
      default: 0
    }
  });
  

const Wallet = mongoose.model('Customer_Wallet', WalletSchema);
export default Wallet;
