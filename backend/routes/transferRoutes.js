import express from "express";
import {
    getTransfers,
    createTransfer,
    dispatchTransfer,
    receiveTransfer
} from "../controllers/transferController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getTransfers);

// Operations User and Admin can manage transfers
router.post("/", protect, authorizeRoles("Admin", "Operations User"), createTransfer);
router.patch("/:id/dispatch", protect, authorizeRoles("Admin", "Operations User"), dispatchTransfer);
router.patch("/:id/receive", protect, authorizeRoles("Admin", "Operations User"), receiveTransfer);

export default router;
