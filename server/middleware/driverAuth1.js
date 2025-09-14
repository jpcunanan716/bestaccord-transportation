// server/middleware/driverAuth.js
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

const driverAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get driver from database
    const driver = await Employee.findById(decoded.id).select("-password");

    if (!driver) {
      return res.status(401).json({ msg: "Driver not found" });
    }

    // Check if user is actually a driver or helper
    if (!["Driver", "Helper"].includes(driver.role)) {
      return res.status(403).json({ msg: "Access denied. Not a driver/helper." });
    }

    // Add driver to request object
    req.driver = driver;
    next();
  } catch (error) {
    console.error("Driver auth middleware error:", error);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export default driverAuth;