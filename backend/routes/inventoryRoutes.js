import express from "express";
import { getInventory, addOrUpdateStock, getInventoryMetadata } from "../controllers/inventoryController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getInventory);
router.get("/metadata", protect, getInventoryMetadata);
// Only Admin and Operations User can add or update inventory stock
router.post("/", protect, authorizeRoles("Admin", "Operations User"), addOrUpdateStock);

export default router;
