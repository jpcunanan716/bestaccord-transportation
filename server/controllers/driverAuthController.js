// server/controllers/driverAuthController.js
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * POST /api/driver/login
 * Logs in a driver/helper and returns a JWT
 */
export const driverLogin = async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    console.log("📩 Login attempt:", { employeeId, password });

    if (!employeeId || !password) {
      return res.status(400).json({ msg: "Please enter employee ID and password" });
    }

    // Find employee by employeeId
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      console.log("❌ No employee found with ID:", employeeId);
      return res.status(400).json({ msg: "Invalid employee ID or password" });
    }

    console.log("✅ Employee found:", {
      dbId: employee.employeeId,
      role: employee.role,
    });

    // Only allow Drivers and Helpers (case-insensitive)
    if (!["driver", "helper"].includes(employee.role.toLowerCase())) {
      console.log("⛔ Role not allowed:", employee.role);
      return res.status(403).json({ msg: "Access denied. Not a driver/helper." });
    }

    // Plain-text password check (Note: In production, use bcrypt.compare)
    if (employee.password !== password) {
      console.log("❌ Password mismatch");
      return res.status(400).json({ msg: "Invalid employee ID or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful for:", employee.employeeId);

    res.json({
      token,
      role: employee.role,
      employeeId: employee.employeeId,
      fullName: employee.fullName,
    });
  } catch (err) {
    console.error("🔥 Driver login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * GET /api/driver/profile
 * Returns profile of logged-in driver/helper
 */
export const getDriverProfile = async (req, res) => {
  try {
    // req.driver is set by the driverAuth middleware
    const driver = req.driver;

    if (!driver) {
      return res.status(404).json({ msg: "Driver profile not found" });
    }

    // Return driver profile without password
    const profileData = {
      _id: driver._id,
      employeeId: driver.employeeId,
      fullName: driver.fullName,
      role: driver.role,
      employmentType: driver.employmentType,
      mobileNumber: driver.mobileNumber,
      currentAddress: driver.currentAddress,
      permanentAddress: driver.permanentAddress,
      emergencyContactName: driver.emergencyContactName,
      emergencyContactNumber: driver.emergencyContactNumber,
      dateHired: driver.dateHired,
      shift: driver.shift,
      email: driver.email,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };

    res.json(profileData);
  } catch (err) {
    console.error("Error fetching driver profile:", err);
    res.status(500).json({ msg: "Server error" });
  }
};