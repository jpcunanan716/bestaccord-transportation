import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";

export const register = async (req, res) => {
  try {
    const { role, email, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "admin") {
      // Only 1 admin allowed
      const existingAdmin = await Admin.findOne({});
      if (existingAdmin) {
        return res.status(400).json({ msg: "Admin already exists" });
      }
      const admin = new Admin({ email, password: hashedPassword });
      await admin.save();
      return res.json({ msg: "Admin registered successfully" });
    } else {
      const staff = new Staff({ name, email, password: hashedPassword });
      await staff.save();
      return res.json({ msg: "Staff registered successfully" });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await Admin.findOne({ email });
    if (!user) user = await Staff.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
