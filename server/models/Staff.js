import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff" },
  isApproved: { type: Boolean, default: false } // <-- NEW
});

export default mongoose.model("Staff", staffSchema);
