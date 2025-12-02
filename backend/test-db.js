// test-db.js (you already created this)
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB OK");
    process.exit(0);
  } catch (err) {
    console.error("DB ERROR:", err);
    process.exit(1);
  }
})();
