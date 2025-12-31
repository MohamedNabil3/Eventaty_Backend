const userService = require("../services/user.service");
// const catchError = require("../utils/catchError");
const { AppError, catchError } = require("../utils/AppError");

// NOTE: Each controller function is wrapped in 'catchError'.
// Why? To automatically catch any errors (Promise rejections or thrown errors) and pass them to the global error handler.
// This keeps the code clean by removing the need for repetitive 'try-catch' blocks in every function.
module.exports.getAllUsers = catchError(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json(users);
});

module.exports.signup = catchError(async (req, res) => {
  const newUser = await userService.signup(req.body);

  console.log(`User created successfully with id: ${newUser._id}`);
  res.status(201).json({
    message: "User created successfully",
    user: {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    },
  });
});

module.exports.login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await userService.login(email, password);
  res.status(200).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
});

module.exports.updateUser = catchError(async (req, res, next) => {
  const user = await userService.updateUser(req.userId, req.body);
  if (user) {
    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } else {
    return next(
      new AppError(
        "NotFoundError",
        "User not found",
        `User with id ${req.params.id} not found`,
        404
      )
    );
  }
});

module.exports.deleteUser = catchError(async (req, res, next) => {
  const user = await userService.deleteUser(req.userId);
  if (user) {
    console.log(`User deleted successfully with id: ${user._id}`);
    res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } else {
    return next(
      new AppError(
        "NotFoundError",
        "User not found",
        `User with id ${req.params.id} not found`,
        404
      )
    );
  }
});

module.exports.getAuthUser = catchError(async (req, res, next) => {
  const user = await userService.getUserById(req.userId);
  if (!user) {
    return next(
      new AppError(
        "NotFoundError",
        "User not found",
        "Authenticated user not found in database",
        404
      )
    );
  }
  res.status(200).json({
    message: "Authenticated",
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
});

module.exports.createAdmin = catchError(async (req, res) => {
  const newUser = await userService.createAdmin(req.body);
  console.log(`Admin created successfully with id: ${newUser._id}`);
  res.status(201).json({
    message: "Admin created successfully",
    user: {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    },
  });
});
