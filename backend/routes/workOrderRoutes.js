import express from "express";
import {
    checkStockAndShortage,
    createWorkOrder,
    getWorkOrders,
    updateWorkOrderStatus
} from "../controllers/workOrderController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/check-stock", protect, checkStockAndShortage);
router.get("/", protect, getWorkOrders);

// Admin can create Work Orders
router.post("/", protect, authorizeRoles("Admin"), createWorkOrder);

// Admin & Operations User can update status
router.patch("/:id/status", protect, authorizeRoles("Admin", "Operations User"), updateWorkOrderStatus);

export default router;
