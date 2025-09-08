import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true },
    manufacturedBy: { type: String, required: true },
    model: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    vehicleType: { type: String, enum: ["Truck", "Car"], required: true },
    color: { type: String },
    chassisNumber: { type: String },
    engineNumber: { type: String },
    registrationExpiryDate: { type: Date },
    status: {
      type: String,
      enum: ["Available", "Not Available", "On Trip"],
      default: "Available",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", VehicleSchema);
