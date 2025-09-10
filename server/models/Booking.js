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
    destinationAddress: { type: String, required: true },
    vehicleType: { type: String, required: true },
    areaLocationCode: { type: String, required: true },
    rateCost: { type: Number, required: true },
    dateNeeded: { type: Date, required: true },
    timeNeeded: { type: String, required: true },
    employeeAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    roleOfEmployee: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
