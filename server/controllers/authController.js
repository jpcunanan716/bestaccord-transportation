import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Staff from "../models/Staff.js";
import User from "../models/User.js"; // If you have an admin User model

// Login function (for both Admin and Staff)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if it's an admin in User model
    let user = await User.findOne({ email });
    let userType = "admin";

    // If not found in User, check Staff model
    if (!user) {
      user = await Staff.findOne({ email });
      userType = "staff";

      // Check if staff account is enabled
      if (user && !user.isEnabled) {
        return res.status(403).json({
          msg: "Your account has been disabled. Please contact administrator."
        });
      }
    }

    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};