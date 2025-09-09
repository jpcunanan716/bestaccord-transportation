import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    location: { type: String, required: true },
    branch: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
