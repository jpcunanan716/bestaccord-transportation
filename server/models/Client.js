import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    address: {
      region: { type: String },
      province: { type: String },
      city: { type: String },
      barangay: { type: String },
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
