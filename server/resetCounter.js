import mongoose from "mongoose";
import dotenv from "dotenv";
import Counter from "./models/Counter.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const counter = await Counter.findOne({ id: "employee" });
    if (counter) {
      counter.seq = 0; // reset to 0
      await counter.save();
      console.log("Employee counter reset to 0");
    } else {
      await Counter.create({ id: "employee", seq: 0 });
      console.log("Employee counter created and set to 0");
    }

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
