import express from "express";
import { loginUser, getMe, getAllUsers, registerUser } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/me", protect, getMe);
router.get("/users", protect, getAllUsers);

export default router;
