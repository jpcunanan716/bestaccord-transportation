import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff", enum: ["staff", "admin"] },
  isEnabled: { type: Boolean, default: true }
});

export default mongoose.model("Staff", staffSchema);
