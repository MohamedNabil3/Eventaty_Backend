const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

const userRouter = Router();

userRouter.get("/", requireAdmin, userController.getAllUsers);
userRouter.get("/verifyAuth", requireAuth, userController.getAuthUser);
userRouter.post("/register", userController.signup);
userRouter.post("/adminRegister", userController.createAdmin);
userRouter.post("/login", userController.login);
userRouter.put("/", requireAuth, userController.updateUser);
userRouter.delete("/", requireAuth, userController.deleteUser);

module.exports = userRouter;
