// server/routes/driverAuth.js (Updated with location tracking and destination delivery)
import express from "express";
import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";
import { driverLogin, getDriverProfile } from "../controllers/driverAuthController.js";
import { 
  getDriverBookings, 
  getDriverBookingById, 
  updateBookingStatus, 
  getDriverBookingCount,
  updateDriverLocation,
  markDestinationDelivered  // ✨ NEW - Import the destination delivery function
} from "../controllers/driverBookingsController.js";
import driverAuth from "../middleware/driverAuth1.js";

const router = express.Router();

// POST /api/driver/driver-login (Original login route)
router.post("/driver-login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    console.log("📩 Login attempt:", { employeeId, password });

    if (!employeeId || !password) {
      return res.status(400).json({ msg: "Please enter employee ID and password" });
    }

    // Find employee by employeeId or employeeID (handle case mismatch)
    const employee = await Employee.findOne({
      $or: [{ employeeId }, { employeeID: employeeId }]
    });

    if (!employee) {
      console.log("❌ No employee found with ID:", employeeId);
      return res.status(400).json({ msg: "Invalid employee ID or password" });
    }

    console.log("✅ Employee found:", {
      dbId: employee.employeeId || employee.employeeID,
      role: employee.role,
      dbPassword: employee.password,
    });

    // Only allow Drivers and Helpers (case-insensitive)
    if (!["driver", "helper"].includes(employee.role.toLowerCase())) {
      console.log("⛔ Role not allowed:", employee.role);
      return res.status(403).json({ msg: "Access denied. Not a driver/helper." });
    }

    // Plain-text password check
    if (employee.password !== password) {
      console.log("❌ Password mismatch. Entered:", password, "DB:", employee.password);
      return res.status(400).json({ msg: "Invalid employee ID or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful for:", employee.employeeId || employee.employeeID);

    res.json({
      token,
      role: employee.role,
      employeeId: employee.employeeId || employee.employeeID,
      fullName: employee.fullName,
    });
  } catch (err) {
    console.error("🔥 Driver login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Authentication routes from driverAuthController
router.post("/login", driverLogin); // Alternative login route
router.get("/profile", driverAuth, getDriverProfile);

// Booking routes for drivers (Note: /count must come before /:id to avoid conflicts)
router.get("/bookings/count", driverAuth, getDriverBookingCount);
router.get("/bookings", driverAuth, getDriverBookings);
router.get("/bookings/:id", driverAuth, getDriverBookingById);
router.put("/bookings/:id/status", driverAuth, updateBookingStatus);

// 🚚 Location tracking route
router.put("/bookings/:id/location", driverAuth, updateDriverLocation);

// ✨ NEW: Mark individual destination as delivered
router.put("/bookings/:id/deliver-destination", driverAuth, markDestinationDelivered);

export default router;