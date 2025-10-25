import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    reservationId: { type: String, unique: true },
    tripNumber: { type: String, unique: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    grossWeight: { type: Number, required: true },
    unitPerPackage: { type: Number, required: true },
    numberOfPackages: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    companyName: { type: String, required: true },
    shipperConsignorName: { type: String, required: true },
    customerEstablishmentName: { type: String, required: true },
    originAddress: { type: String, required: true },
    destinationAddress: [{ type: String, required: true }],
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    tripType: {
        type: String,
        enum: ['single', 'multiple'],
        default: 'single'
    },
    numberOfStops: {
        type: Number,
        default: 1
    },
    vehicleId: {
        type: String,
        required: true
    },
    vehicleType: { type: String, required: true },
    plateNumber: { type: String, required: true },
    vehicleHistory: [{
        vehicleId: { type: String, required: true },
        vehicleType: { type: String, required: true },
        plateNumber: { type: String, required: true },
        startedAt: { type: Date, required: true },
        endedAt: { type: Date },
        reason: { type: String }, // Reason for vehicle change
        status: { type: String, enum: ['active', 'replaced'], default: 'active' }
    }],
    vehicleChangeRequest: {
        requested: { type: Boolean, default: false },
        requestedAt: { type: Date },
        reason: { type: String },
        status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
        approvedAt: { type: Date }
    },

    dateNeeded: { type: Date, required: true },
    timeNeeded: { type: String, required: true },
    employeeAssigned: [{ type: String }],
    roleOfEmployee: [{ type: String }],
    status: {
        type: String,
        enum: ["Pending", "Ready to go", "In Transit", "Delivered", "Completed"],
        default: "Pending"
    },
    isArchived: { type: Boolean, default: false },
    proofOfDelivery: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                if (!v) return true;
                const estimatedSizeMB = (v.length * 0.75) / (1024 * 1024);
                return estimatedSizeMB <= 10;
            },
            message: 'Proof of delivery image must be less than 10MB'
        }
    },
    // Driver's current location tracking
    driverLocation: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        lastUpdated: { type: Date, default: null },
        accuracy: { type: Number, default: null } // GPS accuracy in meters
    }
}, {
    timestamps: true,
    strictQuery: false
});

export default mongoose.model("Booking", bookingSchema);