import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("🟡 Attempting to connect to MongoDB...");

    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Wait 10s before timeout
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed!");
    console.error("➡️ Error Message:", error.message);
    console.error("➡️ Error Name:", error.name);
    console.error("➡️ Full Error:", error);
    console.error("➡️ Stack Trace:", error.stack);

    if (error.reason) {
      console.error("➡️ Reason:", error.reason);
    }

    if (error.errors) {
      console.error("➡️ Individual Errors:", error.errors);
    }

    // Exit process if necessary
    // process.exit(1);
  }
};

// Optional: enable detailed debug logs from Mongoose itself
mongoose.set('debug', true);
