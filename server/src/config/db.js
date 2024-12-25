import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("process.env.MONGO_URL", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};
