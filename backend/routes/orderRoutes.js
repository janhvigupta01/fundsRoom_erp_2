import express from "express";
import {
    getOrders,
    createOrder,
    cancelOrderAndReleaseStock,
    simulateConcurrency
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getOrders);
router.post("/simulate-concurrency", protect, simulateConcurrency);

// Sales User and Admin can create orders and cancel orders
router.post("/", protect, authorizeRoles("Admin", "Sales User"), createOrder);
router.patch("/:id/cancel", protect, authorizeRoles("Admin", "Sales User"), cancelOrderAndReleaseStock);

export default router;
