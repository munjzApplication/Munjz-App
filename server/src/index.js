import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "./config/db.js";
import consultantRoute from "./routes/Consultant/consultantRoute.js";
import customerRoute from "./routes/Customer/customerRoutes.js";
import adminRoute from "./routes/Admin/adminRoutes.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;


// Routes
app.use("/api/consultant", consultantRoute);
app.use("/api/customer", customerRoute);
app.use("/api/admin", adminRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Database connection
  connectDB();
});
