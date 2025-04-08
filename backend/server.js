import dotenv from "dotenv";
dotenv.config();  // Load .env variables before using them

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import memberRoutes from "./routes/memberRoutes.js";  // ✅ Import Member Routes
import userRoutes from "./routes/userRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json({ limit: "10mb" })); // ✅ Increase JSON payload limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());
import attendanceRoutes from "./routes/attendanceRoutes.js";
import certification from "./routes/certification.js";
import complaintsRoutes from "./routes/complaintsRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import membershipPlanRoutes from "./routes/membershipPlanRoutes.js"

app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user/members", memberRoutes);
app.use("/api/user/certifications", certification);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
  console.log("🔍 MONGO_URI:", process.env.MONGO_URI); 

app.get("/", (req, res) => {
  res.send("Gym Management API is running...");
});
app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
