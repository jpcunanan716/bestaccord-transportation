import express from "express";
import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Client from "../models/Client.js";

const router = express.Router();

// Generate next Reservation ID
async function getNextReservationID() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "reservation" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // If seq is somehow missing, set it to 1
    if (!counter.seq) {
      counter.seq = 1;
      await counter.save();
    }

    const seqNumber = counter.seq.toString().padStart(6, "0");
    return `RES${seqNumber}`;
  } catch (error) {
    console.error("Error generating reservation ID:", error);
    throw error;
  }
}

// Generate next Trip Number
async function getNextTripNumber() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "trip" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // If seq is somehow missing, set it to 1
    if (!counter.seq) {
      counter.seq = 1;
      await counter.save();
    }

    const seqNumber = counter.seq.toString().padStart(6, "0");
    return `TRP${seqNumber}`;
  } catch (error) {
    console.error("Error generating trip number:", error);
    throw error;
  }
}

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find();
    // Fetch employee and vehicle details for each booking
    const Employee = (await import("../models/Employee.js")).default;
    const Vehicle = (await import("../models/Vehicle.js")).default;

    // Map bookings to include employeeDetails and vehicle
    const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
      // Employee details
      let employeeDetails = [];
      if (Array.isArray(booking.employeeAssigned)) {
        employeeDetails = await Employee.find({ employeeId: { $in: booking.employeeAssigned } });
      }
      // Vehicle details
      let vehicle = null;
      if (booking.vehicleType) {
        vehicle = await Vehicle.findOne({ vehicleType: booking.vehicleType });
      }
      return {
        ...booking.toObject(),
        employeeDetails: employeeDetails.map(emp => ({
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          role: emp.role
        })),
        vehicle: vehicle ? {
          color: vehicle.color,
          manufacturedBy: vehicle.manufacturedBy,
          model: vehicle.model,
          vehicleType: vehicle.vehicleType
        } : null
      };
    }));
    res.json(bookingsWithDetails);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET booking by reservation ID
router.get("/reservation/:reservationId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ reservationId: req.params.reservationId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: err.message });
  }
});


// GET booking by trip number
router.get("/trip/:tripNumber", async (req, res) => {
  try {
    const booking = await Booking.findOne({ tripNumber: req.params.tripNumber });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single booking
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: err.message });
  }
});



// POST create booking
router.post("/", async (req, res) => {
  try {
    // Remove auto-generated IDs from request body if present (we'll generate them)
    const { reservationId, tripNumber, ...bookingData } = req.body;

    // Generate new reservation ID and trip number
    const newReservationId = await getNextReservationID();
    const newTripNumber = await getNextTripNumber();

    if (!newReservationId || !newTripNumber) {
      return res.status(500).json({ message: "Failed to generate booking IDs" });
    }

    // Create new booking with generated IDs
    const newBooking = new Booking({
      ...bookingData,
      reservationId: newReservationId,
      tripNumber: newTripNumber
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error("Error creating booking:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate booking ID. Please retry." });
    }

    // If it's a duplicate key error, try to handle it gracefully
    if (err.code === 11000) {
      // Check if it's reservationId or tripNumber duplicate
      if (err.keyPattern && (err.keyPattern.reservationId || err.keyPattern.tripNumber)) {
        return res.status(400).json({
          message: "Booking ID generation conflict. Please try again."
        });
      }
      return res.status(400).json({
        message: "Duplicate entry detected"
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

    res.status(500).json({ message: err.message });
  }
});

// PUT update booking
router.put("/:id", async (req, res) => {
  try {
    // Don't allow updating auto-generated IDs through PUT request
    const { reservationId, tripNumber, ...updateData } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error("Error updating booking:", err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({ message: err.message });
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;