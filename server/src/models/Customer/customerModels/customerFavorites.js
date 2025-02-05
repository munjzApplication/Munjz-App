import mongoose from "mongoose";

// Define the Favorite schema
const favoriteSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_Profile",
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer_Profile",
    required: true
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

// Define the Favorite model
const Favorite = mongoose.model("customerFavorite", favoriteSchema);

export default Favorite;