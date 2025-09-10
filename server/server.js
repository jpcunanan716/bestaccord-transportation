import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import vehicleRoutes from "./routes/vehicle.js";
import employeeRoutes from "./routes/employees.js";
import authRoutes from "./routes/Auth.js";
import clientRoutes from "./routes/clients.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/bookings", clientRoutes);

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
