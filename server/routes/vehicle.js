import express from "express";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// Generate next Vehicle ID
async function getNextVehicleID() {
  const lastVehicle = await Vehicle.findOne({}, { vehicleId: 1 }).sort({
    vehicleId: -1,
  });

  if (!lastVehicle || !lastVehicle.vehicleId) {
    return "V001";
  }

  const lastNumber = parseInt(lastVehicle.vehicleId.slice(1));
  const nextNumber = lastNumber + 1;
  return `V${String(nextNumber).padStart(3, "0")}`;
}

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET available vehicles by type (useful for booking assignments)
router.get("/available/:vehicleType", async (req, res) => {
  try {
    const { vehicleType } = req.params;
    const availableVehicles = await Vehicle.find({
      vehicleType,
      status: "Available"
    });
    res.status(200).json(availableVehicles);
  } catch (err) {
    console.error("Error fetching available vehicles:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET vehicle by vehicleId (custom ID like "V001")
router.get("/vehicleId/:vehicleId", async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    console.error("Error fetching vehicle by vehicleId:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single vehicle by MongoDB _id
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

// POST create new vehicle
router.post("/", async (req, res) => {
  try {
    const vehicleId = await getNextVehicleID();
    const vehicle = new Vehicle({
      ...req.body,
      vehicleId,
      status: "Available", // Set default status
    });

    await vehicle.save();

    console.log("✅ New vehicle created:", {
      _id: vehicle._id,
      vehicleId: vehicle.vehicleId,
      vehicleType: vehicle.vehicleType,
      status: vehicle.status
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Vehicle with this registration number or plate number already exists"
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(400).json({ message: err.message });
  }
});

// PUT update vehicle
router.put("/:id", async (req, res) => {
  try {
    // Don't allow updating vehicleId through PUT (it's auto-generated)
    const { vehicleId, ...updateData } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("🔄 Vehicle updated:", {
      _id: vehicle._id,
      vehicleId: vehicle.vehicleId,
      status: vehicle.status
    });

    res.status(200).json(vehicle);
  } catch (err) {
    console.error("Error updating vehicle:", err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({ msg: err.message });
  }
});

// PATCH update vehicle status only (optimized for status updates)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const vehicleId = req.params.id;

    // Validate status
    const allowedStatuses = ["Available", "Not Available", "On Trip"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(", ")}`
      });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    console.log("🚗 Vehicle status updated:", {
      _id: updatedVehicle._id,
      vehicleId: updatedVehicle.vehicleId,
      status: updatedVehicle.status
    });

    res.json({
      success: true,
      message: "Vehicle status updated successfully",
      vehicle: {
        _id: updatedVehicle._id,
        vehicleId: updatedVehicle.vehicleId,
        vehicleType: updatedVehicle.vehicleType,
        status: updatedVehicle.status,
        updatedAt: updatedVehicle.updatedAt
      }
    });
  } catch (err) {
    console.error("Error updating vehicle status:", err);
    res.status(500).json({ success: false, message: "Server error while updating status" });
  }
});

// PATCH archive vehicle
router.patch('/:id/archive', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.json({
      success: true,
      message: "Vehicle archived successfully",
      vehicle
    });
  } catch (err) {
    console.error('Error archiving vehicle:', err);
    res.status(500).json({
      success: false,
      message: "Error archiving vehicle"
    });
  }
});

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if vehicle is currently on a trip
    if (vehicle.status === "On Trip") {
      return res.status(400).json({
        message: "Cannot delete vehicle that is currently on a trip. Please complete the trip first."
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    console.log("🗑️ Vehicle deleted:", {
      _id: vehicle._id,
      vehicleId: vehicle.vehicleId
    });

    res.status(200).json({ msg: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;