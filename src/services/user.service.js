const User = require("../models/User");
const { AppError } = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const maxAge = 5 * 24 * 60 * 60; // 3 days

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

const signup = async (userData) => {
  const { email, password, firstName, lastName, phone } = userData;

  const newUser = new User({
    email,
    password,
    firstName,
    lastName,
    phone,
  });

  await newUser.save();
  return newUser;
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      const token = createToken(user._id);
      return { user, token };
    }
    throw new AppError(
      "AuthenticationError",
      "Incorrect credentials",
      "Invalid email or password",
      401
    );
  }
  throw new AppError(
    "AuthenticationError",
    "Incorrect credentials",
    "Invalid email or password",
    401
  );
};

const getAllUsers = async () => {
  return await User.find();
};

const getUserById = async (id) => {
  return await User.findById(id);
};

const updateUser = async (id, updates) => {
  return await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id, { new: true });
};

const createAdmin = async (userData) => {
  const { email, password, firstName, lastName, phone, adminSecret } = userData;

  if (process.env.adminSecret !== adminSecret) {
    throw new AppError(
      "AuthorizationError",
      "Forbidden",
      "You are not authorized to do this action",
      403
    );
  }

  const newUser = new User({
    email,
    password,
    firstName,
    lastName,
    phone,
    role: "admin",
  });

  await newUser.save();
  return newUser;
};

module.exports = {
  signup,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdmin,
};
