import express from "express";
import Staff from "../models/Staff.js";

const router = express.Router();

// Get all pending staff
router.get("/pending", async (req, res) => {
  try {
    const pending = await Staff.find({ isApproved: false });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Approve a staff account
router.put("/approve/:id", async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!staff) return res.status(404).json({ msg: "Staff not found" });
    res.json({ msg: "Staff approved successfully", staff });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
