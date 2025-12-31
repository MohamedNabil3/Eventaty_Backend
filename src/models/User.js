const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// --- 1. User Schema ---
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// fire a function before doc saved to db
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hashed = await bcrypt.hash(this.password, 10);
  this.password = hashed;
  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
