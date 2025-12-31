const mongoose = require("mongoose");
require("dotenv").config();

const dbURI =
  process.env.mongoDB_URI || "mongodb://localhost:27017/BookingSystem";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
