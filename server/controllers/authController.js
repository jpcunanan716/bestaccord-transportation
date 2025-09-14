import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Staff from "../models/Staff.js"; // adjust path if needed

// Register function
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new Staff({
      name,
      email,
      password: hashedPassword,
      role: role || "staff",
      isApproved: false, // new staff must wait for admin approval
    });

    await newStaff.save();

    res.json({ msg: "Registration successful! Pending admin approval." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // ✅ check approval before login
    if (staff.role === "staff" && !staff.isApproved) {
      return res.status(403).json({ msg: "Your account is not approved yet. Please contact Admin" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      msg: "Login successful",
      token,
      role: staff.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
