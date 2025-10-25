import Booking from "../models/Booking.js";
import Employee from "../models/Employee.js";
import Vehicle from "../models/Vehicle.js";

/**
 * GET /api/driver/bookings/count
 * Returns the count of ACTIVE bookings assigned to the logged-in driver/helper
 * (excludes completed bookings)
 */
export const getDriverBookingCount = async (req, res) => {
  try {
    const driver = req.driver;

    if (!driver) {
      return res.status(404).json({
        success: false,
        msg: "Driver not found"
      });
    }

    console.log("🔢 Fetching booking count for driver:", driver.employeeId);

    // Count ONLY active bookings (not completed) assigned to this driver
    const count = await Booking.countDocuments({
      employeeAssigned: { $in: [driver.employeeId] },
      status: { $ne: "Completed" }  // ✨ NEW: Exclude completed bookings
    });

    console.log("📊 Active booking count for driver", driver.employeeId, ":", count);

    res.json({
      success: true,
      count,
      driverEmployeeId: driver.employeeId
    });

  } catch (err) {
    console.error("❌ Error fetching booking count:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching booking count",
      error: err.message
    });
  }
};

/**
 * GET /api/driver/bookings
 * Returns bookings assigned to the logged-in driver/helper
 */
export const getDriverBookings = async (req, res) => {
  try {
    // req.driver is set by the driverAuth middleware
    const driver = req.driver;

    console.log("🔍 DEBUG: Driver from middleware:", {
      id: driver._id,
      employeeId: driver.employeeId,
      fullName: driver.fullName,
      role: driver.role
    });

    if (!driver) {
      console.log("❌ DEBUG: No driver found in request");
      return res.status(404).json({ msg: "Driver not found" });
    }

    console.log("🔍 Fetching bookings for driver:", driver.employeeId);

    // First, let's get ALL bookings to see what's in the database
    const allBookings = await Booking.find({});
    console.log("📋 DEBUG: Total bookings in database:", allBookings.length);

    // Log the employeeAssigned field for each booking
    allBookings.forEach((booking, index) => {
      console.log(`📋 DEBUG: Booking ${index + 1}:`, {
        reservationId: booking.reservationId,
        employeeAssigned: booking.employeeAssigned,
        employeeAssignedType: typeof booking.employeeAssigned,
        employeeAssignedIsArray: Array.isArray(booking.employeeAssigned)
      });
    });

    // Try multiple query approaches
    console.log("🔍 Searching for driver employeeId:", driver.employeeId);

    // Query 1: Direct array search
    const bookings1 = await Booking.find({
      employeeAssigned: { $in: [driver.employeeId] }
    });
    console.log("📋 Query 1 ($in array) - Found bookings:", bookings1.length);

    // Query 2: Direct element match
    const bookings2 = await Booking.find({
      employeeAssigned: driver.employeeId
    });
    console.log("📋 Query 2 (direct match) - Found bookings:", bookings2.length);

    // Query 3: String contains (in case there are formatting issues)
    const bookings3 = await Booking.find({
      employeeAssigned: { $regex: driver.employeeId, $options: 'i' }
    });
    console.log("📋 Query 3 (regex) - Found bookings:", bookings3.length);

    // Use the query that returns the most results
    let bookings = bookings1.length > 0 ? bookings1 :
      bookings2.length > 0 ? bookings2 :
        bookings3.length > 0 ? bookings3 : [];

    console.log("📋 Final bookings selected:", bookings.length);

    // If still no bookings, let's check if the driver exists in any booking
    if (bookings.length === 0) {
      console.log("🔍 No bookings found. Checking if driver ID exists in any booking...");

      const bookingsWithDriver = await Booking.find({
        $or: [
          { employeeAssigned: { $elemMatch: { $eq: driver.employeeId } } },
          { employeeAssigned: { $regex: driver.employeeId } }
        ]
      });

      console.log("📋 Bookings with driver ID (alternative search):", bookingsWithDriver.length);
      bookings = bookingsWithDriver;
    }

    // Sort by date, newest first
    bookings = bookings.sort((a, b) => new Date(b.dateNeeded) - new Date(a.dateNeeded));

    console.log("📋 Found bookings for driver:", bookings.length);

    // Enhance bookings with additional details
    const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
      console.log("🔧 Processing booking:", booking.reservationId);

      // Get all assigned employees details
      let employeeDetails = [];
      if (Array.isArray(booking.employeeAssigned)) {
        employeeDetails = await Employee.find({
          employeeId: { $in: booking.employeeAssigned }
        }).select('employeeId fullName role');
        console.log("👥 Employee details found:", employeeDetails.length);
      } else if (booking.employeeAssigned) {
        // Handle single employee assignment
        const emp = await Employee.findOne({ employeeId: booking.employeeAssigned });
        if (emp) {
          employeeDetails = [{
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            role: emp.role
          }];
        }
        console.log("👤 Single employee details found:", employeeDetails.length);
      }

      // Get vehicle details (if available)
      let vehicleDetails = null;
      try {
        vehicleDetails = await Vehicle.findOne({ vehicleType: booking.vehicleType });
        console.log("🚛 Vehicle details found:", !!vehicleDetails);
      } catch (err) {
        console.log("⚠️ Vehicle model not found, skipping vehicle details");
      }

      return {
        ...booking.toObject(),
        employeeDetails,
        vehicleDetails: vehicleDetails ? {
          color: vehicleDetails.color,
          manufacturedBy: vehicleDetails.manufacturedBy,
          model: vehicleDetails.model,
          plateNumber: vehicleDetails.plateNumber,
          vehicleType: vehicleDetails.vehicleType
        } : null,
        isCurrentDriver: true
      };
    }));

    console.log("✅ Returning enhanced bookings:", enhancedBookings.length);

    res.json({
      success: true,
      count: enhancedBookings.length,
      bookings: enhancedBookings,
      debug: {
        driverEmployeeId: driver.employeeId,
        totalBookingsInDB: allBookings.length,
        queriedBookings: bookings.length
      }
    });

  } catch (err) {
    console.error("❌ Error fetching driver bookings:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching bookings",
      error: err.message
    });
  }
};

/**
 * GET /api/driver/bookings/:id
 * Get specific booking details for the logged-in driver
 */
export const getDriverBookingById = async (req, res) => {
  try {
    const driver = req.driver;
    const bookingId = req.params.id;

    console.log("🔍 DEBUG: Getting booking details for:", bookingId, "by driver:", driver.employeeId);

    // Find the booking and verify the driver is assigned to it
    const booking = await Booking.findOne({
      _id: bookingId,
      employeeAssigned: { $in: [driver.employeeId] }
    });

    if (!booking) {
      console.log("❌ DEBUG: Booking not found or driver not assigned");
      return res.status(404).json({
        success: false,
        msg: "Booking not found or you are not assigned to this booking"
      });
    }

    console.log("✅ DEBUG: Booking found:", booking.reservationId);

    // Get employee details
    const employeeDetails = await Employee.find({
      employeeId: { $in: booking.employeeAssigned }
    }).select('employeeId fullName role');

    // Get vehicle details
    let vehicleDetails = null;
    try {
      vehicleDetails = await Vehicle.findOne({ vehicleType: booking.vehicleType });
    } catch (err) {
      console.log("⚠️ Vehicle model not found");
    }

    const enhancedBooking = {
      ...booking.toObject(),
      employeeDetails: employeeDetails.map(emp => ({
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        role: emp.role
      })),
      vehicleDetails: vehicleDetails ? {
        color: vehicleDetails.color,
        manufacturedBy: vehicleDetails.manufacturedBy,
        model: vehicleDetails.model,
        plateNumber: vehicleDetails.plateNumber,
        vehicleType: vehicleDetails.vehicleType
      } : null
    };

    res.json({
      success: true,
      booking: enhancedBooking
    });

  } catch (err) {
    console.error("❌ Error fetching booking details:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching booking details"
    });
  }
};

/**
 * PUT /api/driver/bookings/:id/status
 * Update booking status (drivers can update status of their assigned bookings)
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const driver = req.driver;
    const bookingId = req.params.id;
    const { status, proofOfDelivery } = req.body;

    console.log("🔄 Updating booking status:", {
      bookingId,
      driverId: driver.employeeId,
      newStatus: status,
      hasProofOfDelivery: !!proofOfDelivery,
      proofSize: proofOfDelivery ? `${(proofOfDelivery.length / 1024).toFixed(2)} KB` : 'N/A'
    });

    // Validate status
    const allowedStatuses = ["Pending", "In Transit", "Delivered", "Completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status. Allowed: " + allowedStatuses.join(", ")
      });
    }

    // Validate proof of delivery for completed status
    if (status === "Completed" && !proofOfDelivery) {
      return res.status(400).json({
        success: false,
        msg: "Proof of delivery is required to complete a booking"
      });
    }

    // Validate proof of delivery format
    if (proofOfDelivery) {
      if (!proofOfDelivery.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          msg: "Invalid proof of delivery format. Must be a base64 image."
        });
      }

      // Check image size (limit to 10MB base64 - increased for mobile compatibility)
      const sizeInMB = (proofOfDelivery.length * 0.75) / (1024 * 1024);
      console.log(`📸 Proof of delivery size: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 10) {
        console.error(`❌ Image too large: ${sizeInMB.toFixed(2)} MB`);
        return res.status(413).json({
          success: false,
          msg: `Proof of delivery image is too large (${sizeInMB.toFixed(2)} MB). Maximum 10MB allowed.`
        });
      }
    }

    // Find the booking first
    const booking = await Booking.findOne({
      _id: bookingId,
      employeeAssigned: { $in: [driver.employeeId] }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found or you are not assigned to this booking"
      });
    }

    // Update booking status
    booking.status = status;
    booking.updatedAt = new Date();
    
    // If proof of delivery is provided, save it
    if (proofOfDelivery) {
      booking.proofOfDelivery = proofOfDelivery;
      console.log("📸 Proof of delivery image saved successfully");
    }

    await booking.save();

    // If status is being set to "Completed", update vehicle and employee status
    if (status === "Completed") {
      try {
        await updateVehicleAndEmployeeStatus(booking, "Available");
      } catch (error) {
        console.error("Failed to update vehicle/employee status:", error);
        // Continue with booking update even if vehicle/employee updates fail
      }
    }

    console.log(`✅ Driver ${driver.employeeId} updated booking ${booking.reservationId} status to: ${status}`);

    res.json({
      success: true,
      msg: "Booking status updated successfully",
      booking: {
        _id: booking._id,
        reservationId: booking.reservationId,
        tripNumber: booking.tripNumber,
        status: booking.status,
        proofOfDelivery: booking.proofOfDelivery ? "Stored" : null,
        updatedAt: booking.updatedAt
      }
    });

  } catch (err) {
    console.error("❌ Error updating booking status:", err);
    console.error("❌ Full error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    // Handle specific MongoDB errors
    if (err.name === 'DocumentNotFoundError') {
      return res.status(404).json({
        success: false,
        msg: "Booking not found"
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        msg: "Invalid data: " + err.message
      });
    }

    // Handle document size errors
    if (err.message && err.message.includes('document is too large')) {
      return res.status(413).json({
        success: false,
        msg: "Image file is too large. Please capture a smaller image."
      });
    }

    res.status(500).json({
      success: false,
      msg: "Server error while updating status",
      error: err.message
    });
  }
};

// Helper function to update vehicle and employee status
async function updateVehicleAndEmployeeStatus(booking, newStatus) {
  try {
    // Update vehicle status
    if (booking.vehicleType) {
      const vehicle = await Vehicle.findOneAndUpdate(
        { vehicleType: booking.vehicleType },
        { status: newStatus }
      );
      console.log(`✅ Vehicle ${booking.vehicleType} status updated to ${newStatus}`);
    }

    // Update employees status
    if (Array.isArray(booking.employeeAssigned) && booking.employeeAssigned.length > 0) {
      const result = await Employee.updateMany(
        { employeeId: { $in: booking.employeeAssigned } },
        { status: newStatus }
      );
      console.log(`✅ ${result.modifiedCount} employees updated to ${newStatus}`);
    }
  } catch (error) {
    console.error("❌ Error updating statuses:", error);
    throw error;
  }
}

/**
 * PUT /api/driver/bookings/:id/location
 * Update driver's current location for a booking
 */
export const updateDriverLocation = async (req, res) => {
  try {
    const driver = req.driver;
    const bookingId = req.params.id;
    const { latitude, longitude, accuracy } = req.body;

    console.log("📍 Updating driver location:", {
      bookingId,
      driverId: driver.employeeId,
      latitude,
      longitude,
      accuracy
    });

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        msg: "Latitude and longitude are required"
      });
    }

    // Validate latitude range (-90 to 90)
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        msg: "Invalid latitude. Must be between -90 and 90"
      });
    }

    // Validate longitude range (-180 to 180)
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        msg: "Invalid longitude. Must be between -180 and 180"
      });
    }

    // Find the booking and verify the driver is assigned to it
    const booking = await Booking.findOne({
      _id: bookingId,
      employeeAssigned: { $in: [driver.employeeId] }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found or you are not assigned to this booking"
      });
    }

    // Only allow location updates for In Transit bookings
    if (booking.status !== "In Transit") {
      return res.status(400).json({
        success: false,
        msg: "Location can only be updated for trips that are In Transit"
      });
    }

    // Update driver location
    booking.driverLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      lastUpdated: new Date(),
      accuracy: accuracy ? parseFloat(accuracy) : null
    };

    await booking.save();

    console.log(`✅ Driver location updated for booking ${booking.reservationId}`);

    res.json({
      success: true,
      msg: "Location updated successfully",
      location: booking.driverLocation
    });

  } catch (err) {
    console.error("❌ Error updating driver location:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while updating location",
      error: err.message
    });
  }
};

