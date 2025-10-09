import express from "express";
import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";

const router = express.Router();

// Get all staff
router.get("/", async (req, res) => {
  try {
    const staff = await Staff.find().select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single staff
router.get("/:id", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select("-password");
    if (!staff) {
      return res.status(404).json({ msg: "Staff not found" });
    }
    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create new staff (Admin only)
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please provide all required fields" });
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new staff
    const newStaff = new Staff({
      name,
      email,
      password: hashedPassword,
      role: role || "staff",
      isEnabled: true // Enabled by default
    });

    await newStaff.save();

    // Return staff without password
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json(staffResponse);
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update staff
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = { name, email };

    // Only update password if provided
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!staff) {
      return res.status(404).json({ msg: "Staff not found" });
    }

    res.json(staff);
  } catch (err) {
    console.error("Error updating staff:", err);

    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error" });
  }
});

// Toggle staff status (enable/disable login)
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const { isEnabled } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isEnabled },
      { new: true }
    ).select("-password");

    if (!staff) {
      return res.status(404).json({ msg: "Staff not found" });
    }

    res.json(staff);
  } catch (err) {
    console.error("Error toggling staff status:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete staff
router.delete("/:id", async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({ msg: "Staff not found" });
    }

    res.json({ msg: "Staff deleted successfully" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;