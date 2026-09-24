import express from "express";
import AuditLog from "../models/AuditLog.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(50);
        return res.json(logs);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
    }
});

export default router;
