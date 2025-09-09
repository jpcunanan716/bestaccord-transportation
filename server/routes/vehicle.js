import express from "express";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET single vehicle
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST add vehicle
router.post("/", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PUT update vehicle
router.put("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
