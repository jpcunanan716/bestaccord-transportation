import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    clientBranch: { type: String, required: true },
    address: {
      houseNumber: { type: String },
      street: { type: String },
      region: { type: String },
      province: { type: String },
      city: { type: String },
      barangay: { type: String },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);