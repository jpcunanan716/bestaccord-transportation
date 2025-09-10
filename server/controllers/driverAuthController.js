// controllers/driverAuthController.js
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
    // Find driver by employeeId
    const driver = await Employee.findOne({ employeeId });

    if (!driver) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT
    const payload = {
      id: driver._id,
      role: driver.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

/**
 * GET /api/driver/profile
 * Returns profile of logged-in driver/helper
 */
export const getDriverProfile = async (req, res) => {
  try {
    const driver = await Employee.findById(req.user.id).select(
      "fullName employeeId role employmentType currentAddress permanentAddress dateHired shift"
    );

    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
