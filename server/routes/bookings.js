import express from "express";
import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Vehicle from "../models/Vehicle.js";
import Employee from "../models/Employee.js";
import {
  getVehicleChangeRequests,
  approveVehicleChange,
  rejectVehicleChange
} from '../controllers/bookingsController.js';

const router = express.Router();

// Generate next Reservation ID
async function getNextReservationID() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "reservation" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

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
    const Employee = (await import("../models/Employee.js")).default;
    const Vehicle = (await import("../models/Vehicle.js")).default;

    const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
      let employeeDetails = [];
      if (Array.isArray(booking.employeeAssigned)) {
        employeeDetails = await Employee.find({ employeeId: { $in: booking.employeeAssigned } });
      }
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

async function updateVehicleAndEmployeeStatus(booking, newStatus) {
  try {
    if (booking.vehicleId) {
      const vehicleResult = await Vehicle.findOneAndUpdate(
        { vehicleId: booking.vehicleId },
        { status: newStatus },
        { new: true }
      );
      if (!vehicleResult) {
        console.warn(`⚠️ Vehicle ${booking.vehicleId} not found`);
      } else {
        console.log(`✅ Vehicle ${booking.vehicleId} status updated to ${newStatus}`);
      }
    }

    // Update employees status
    if (Array.isArray(booking.employeeAssigned) && booking.employeeAssigned.length > 0) {
      const employeeResult = await Employee.updateMany(
        { employeeId: { $in: booking.employeeAssigned } },
        { status: newStatus }
      );
      console.log(`✅ ${employeeResult.modifiedCount} employees updated to ${newStatus}`);
    }
  } catch (error) {
    console.error("❌ Error updating statuses:", error);
    throw error;
  }
}

// POST create booking
router.post("/", async (req, res) => {
  try {
    const { reservationId, tripNumber, ...bookingData } = req.body;

    // Generate new IDs
    const newReservationId = await getNextReservationID();
    const newTripNumber = await getNextTripNumber();

    if (!newReservationId || !newTripNumber) {
      return res.status(500).json({ message: "Failed to generate booking IDs" });
    }

    // Create new booking
    const newBooking = new Booking({
      ...bookingData,
      reservationId: newReservationId,
      tripNumber: newTripNumber,
      status: "Pending"
    });

    const savedBooking = await newBooking.save();


    // Update vehicle and employee statuses to "On Trip"
    await updateVehicleAndEmployeeStatus(savedBooking, "On Trip");

    res.status(201).json(savedBooking);
  } catch (err) {
    console.error("Error creating booking:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate booking ID. Please retry." });
    }

    if (err.code === 11000) {
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
    // First, get the current booking to check its status
    const currentBooking = await Booking.findById(req.params.id);
    if (!currentBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Prevent editing if booking is ready to go or in transit
    if (currentBooking.status === "Ready to go" || currentBooking.status === "In Transit") {
      return res.status(400).json({
        message: "Cannot edit booking while ready to go or in transit"
      });
    }

    console.log("🔄 Updating booking:", req.params.id, "with data:", req.body);

    // Don't allow updating auto-generated IDs through PUT request (except for status updates)
    const { reservationId, tripNumber, ...updateData } = req.body;

    // Special handling for status updates from admin
    if (updateData.status) {
      console.log("📝 Status update requested:", updateData.status);

      // Validate status
      const allowedStatuses = ["Pending", "Ready to go", "In Transit", "Delivered", "Completed"];
      if (!allowedStatuses.includes(updateData.status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed statuses: ${allowedStatuses.join(", ")}`
        });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("✅ Booking updated successfully:", {
      id: updatedBooking._id,
      reservationId: updatedBooking.reservationId,
      status: updatedBooking.status
    });

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

// PATCH update booking status only
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    console.log("🔄 Status update request:", { bookingId, status });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      booking: {
        _id: booking._id,
        reservationId: booking.reservationId,
        tripNumber: booking.tripNumber,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    });

  } catch (err) {
    console.error("❌ Error updating booking status:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating status"
    });
  }
});

// PATCH archive booking
router.patch('/:id/archive', async (req, res) => {
  try {
    // First, get the current booking to check its status
    const currentBooking = await Booking.findById(req.params.id);
    if (!currentBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Prevent archiving if booking is ready to go or in transit
    if (currentBooking.status === "Ready to go" || currentBooking.status === "In Transit") {
      return res.status(400).json({
        success: false,
        message: "Cannot archive booking while ready to go or in transit"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking archived successfully",
      booking
    });
  } catch (err) {
    console.error('Error archiving booking:', err);
    res.status(500).json({
      success: false,
      message: "Error archiving booking"
    });
  }
});

// PATCH restore booking
router.patch('/:id/restore', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking restored successfully",
      booking
    });
  } catch (err) {
    console.error('Error restoring booking:', err);
    res.status(500).json({
      success: false,
      message: "Error restoring booking"
    });
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

/**
 * GET /api/bookings/vehicle-change-requests
 * Get all pending vehicle change requests (Admin)
 */
export const getVehicleChangeRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({
      'vehicleChangeRequest.requested': true,
      'vehicleChangeRequest.status': 'pending'
    }).sort({ 'vehicleChangeRequest.requestedAt': -1 });

    console.log(`📋 Found ${bookings.length} pending vehicle change requests`);

    // Enhance with employee details
    const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
      const employeeDetails = await Employee.find({
        employeeId: { $in: booking.employeeAssigned }
      }).select('employeeId fullName role');

      return {
        ...booking.toObject(),
        employeeDetails
      };
    }));

    res.json({
      success: true,
      count: enhancedBookings.length,
      bookings: enhancedBookings
    });

  } catch (err) {
    console.error("❌ Error fetching vehicle change requests:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching requests",
      error: err.message
    });
  }
};

/**
 * PUT /api/bookings/:id/approve-vehicle-change
 * Admin approves vehicle change and replaces vehicle
 */
export const approveVehicleChange = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { newVehicleId, adminNote } = req.body;

    console.log("✅ Approving vehicle change:", {
      bookingId,
      newVehicleId
    });

    if (!newVehicleId) {
      return res.status(400).json({
        success: false,
        msg: "New vehicle ID is required"
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found"
      });
    }

    if (!booking.vehicleChangeRequest?.requested || 
        booking.vehicleChangeRequest?.status !== 'pending') {
      return res.status(400).json({
        success: false,
        msg: "No pending vehicle change request found for this booking"
      });
    }

    // Find the new vehicle
    const newVehicle = await Vehicle.findOne({ vehicleId: newVehicleId });

    if (!newVehicle) {
      return res.status(404).json({
        success: false,
        msg: "New vehicle not found"
      });
    }

    if (newVehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        msg: "Selected vehicle is not available"
      });
    }

    // Store old vehicle info
    const oldVehicleId = booking.vehicleId;
    const oldVehicleType = booking.vehicleType;
    const oldPlateNumber = booking.plateNumber;

    // Initialize vehicle history if not exists
    if (!booking.vehicleHistory) {
      booking.vehicleHistory = [];
    }

    // Add current vehicle to history (mark as replaced)
    booking.vehicleHistory.push({
      vehicleId: oldVehicleId,
      vehicleType: oldVehicleType,
      plateNumber: oldPlateNumber,
      startedAt: booking.createdAt,
      endedAt: new Date(),
      reason: booking.vehicleChangeRequest.reason,
      status: 'replaced'
    });

    // Add new vehicle to history (mark as active)
    booking.vehicleHistory.push({
      vehicleId: newVehicle.vehicleId,
      vehicleType: newVehicle.vehicleType,
      plateNumber: newVehicle.plateNumber,
      startedAt: new Date(),
      reason: 'Replacement vehicle',
      status: 'active'
    });

    // Update booking with new vehicle
    booking.vehicleId = newVehicle.vehicleId;
    booking.vehicleType = newVehicle.vehicleType;
    booking.plateNumber = newVehicle.plateNumber;

    // Update vehicle change request status
    booking.vehicleChangeRequest.status = 'approved';
    booking.vehicleChangeRequest.approvedAt = new Date();
    booking.vehicleChangeRequest.approvedBy = adminNote || 'Admin';

    await booking.save();

    // Update old vehicle status to "Not Available"
    await Vehicle.findOneAndUpdate(
      { vehicleId: oldVehicleId },
      { status: "Not Available" }
    );
    console.log(`🚫 Old vehicle ${oldVehicleId} marked as Not Available`);

    // Update new vehicle status to "On Trip"
    await Vehicle.findOneAndUpdate(
      { vehicleId: newVehicle.vehicleId },
      { status: "On Trip" }
    );
    console.log(`✅ New vehicle ${newVehicle.vehicleId} marked as On Trip`);

    console.log(`✅ Vehicle change approved for booking ${booking.reservationId}`);

    res.json({
      success: true,
      msg: "Vehicle change approved successfully",
      booking: {
        _id: booking._id,
        reservationId: booking.reservationId,
        tripNumber: booking.tripNumber,
        oldVehicle: { vehicleId: oldVehicleId, vehicleType: oldVehicleType, plateNumber: oldPlateNumber },
        newVehicle: { vehicleId: newVehicle.vehicleId, vehicleType: newVehicle.vehicleType, plateNumber: newVehicle.plateNumber },
        vehicleHistory: booking.vehicleHistory,
        vehicleChangeRequest: booking.vehicleChangeRequest
      }
    });

  } catch (err) {
    console.error("❌ Error approving vehicle change:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while approving vehicle change",
      error: err.message
    });
  }
};

/**
 * PUT /api/bookings/:id/reject-vehicle-change
 * Admin rejects vehicle change request
 */
export const rejectVehicleChange = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found"
      });
    }

    if (!booking.vehicleChangeRequest?.requested || 
        booking.vehicleChangeRequest?.status !== 'pending') {
      return res.status(400).json({
        success: false,
        msg: "No pending vehicle change request found"
      });
    }

    booking.vehicleChangeRequest.status = 'rejected';
    booking.vehicleChangeRequest.rejectionReason = rejectionReason || 'Request denied by admin';

    await booking.save();

    console.log(`❌ Vehicle change request rejected for booking ${booking.reservationId}`);

    res.json({
      success: true,
      msg: "Vehicle change request rejected",
      booking: {
        _id: booking._id,
        reservationId: booking.reservationId,
        vehicleChangeRequest: booking.vehicleChangeRequest
      }
    });

  } catch (err) {
    console.error("❌ Error rejecting vehicle change:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while rejecting request",
      error: err.message
    });
  }
};

// Get all pending vehicle change requests
router.get("/vehicle-change-requests", getVehicleChangeRequests);

// Approve vehicle change
router.put("/:id/approve-vehicle-change", approveVehicleChange);

// Reject vehicle change
router.put("/:id/reject-vehicle-change", rejectVehicleChange);

export default router;