import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "./config/db.js";
import consultantRoute from "./routes/Consultant/consultantRoute.js";
import customerRoute from "./routes/Customer/customerRoutes.js";
import adminRoute from "./routes/Admin/adminRoutes.js";
import chatRoutes from "./routes/chat/chatRoutes.js";
import http from "http";
import helmet from "helmet";
import { setupSocket } from "./socket/socketController.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

app.use(helmet());

//CORS configuration - allow only your frontend
const allowedOrigins = [process.env.PRODUCTION_BASE_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming request origin:", origin);
      console.log("Allowed origins:", allowedOrigins);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ CORS Blocked for:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Root Route for testing
app.get("/", (req, res) => {
  res.send("Munjz Backend is Running");
});

// Routes
app.use("/api/consultant", consultantRoute);
app.use("/api/customer", customerRoute);
app.use("/api/admin", adminRoute);
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message || "Internal Server Error"
  });
});

// 🔌 Setup Socket.io
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
