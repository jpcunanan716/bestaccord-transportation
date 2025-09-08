import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientId: { type: String, unique: true },
    clientName: { type: String, required: true },
    location: { type: String, required: true },
    branch: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
