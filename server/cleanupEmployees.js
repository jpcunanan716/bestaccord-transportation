import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "./models/Employee.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Delete all employees where employeeId is null
    const result = await Employee.deleteMany({ employeeId: null });
    console.log(`Deleted ${result.deletedCount} employees with null employeeId`);

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
