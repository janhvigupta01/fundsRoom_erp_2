import WorkOrder from "../models/WorkOrder.js";
import Inventory from "../models/Inventory.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Calculate stock availability and shortage for a work order
// @route   GET /api/work-orders/check-stock
// @access  Private
export const checkStockAndShortage = async (req, res) => {
    try {
        const { location, item, requiredQuantity } = req.query;

        if (!location || !item) {
            return res.status(400).json({ message: "Location and item query parameters are required" });
        }

        const required = Number(requiredQuantity) || 0;

        // Find all inventory records for this item at this location
        const inventoryRecords = await Inventory.find({ location, item });

        // Sum up total available stock at this location
        const totalAvailable = inventoryRecords.reduce((sum, record) => sum + record.availableQuantity, 0);
        const totalPhysical = inventoryRecords.reduce((sum, record) => sum + record.physicalQuantity, 0);
        const totalReserved = inventoryRecords.reduce((sum, record) => sum + record.reservedQuantity, 0);

        // Calculate shortage automatically: Shortage = Math.max(0, Required - Available)
        const shortage = Math.max(0, required - totalAvailable);
        const hasShortage = shortage > 0;

        // Also check if other locations have this item (to assist with Internal Stock Transfer!)
        const otherLocations = await Inventory.aggregate([
            { $match: { item, location: { $ne: location } } },
            {
                $group: {
                    _id: "$location",
                    availableQuantity: { $sum: "$availableQuantity" },
                    physicalQuantity: { $sum: "$physicalQuantity" }
                }
            }
        ]);

        return res.json({
            item,
            location,
            requiredMaterial: required,
            availableAtLocation: totalAvailable,
            physicalAtLocation: totalPhysical,
            reservedAtLocation: totalReserved,
            shortage,
            hasShortage,
            batches: inventoryRecords,
            otherLocationsAvailability: otherLocations
        });
    } catch (error) {
        console.error("Check stock error:", error);
        return res.status(500).json({ message: "Error calculating stock shortage", error: error.message });
    }
};

// @desc    Create a new Work Order
// @route   POST /api/work-orders
// @access  Private (Admin only)
export const createWorkOrder = async (req, res) => {
    try {
        const { workOrderId, location, item, requiredQuantity, assignedUser, notes } = req.body;

        if (!location || !item || !requiredQuantity || !assignedUser) {
            return res.status(400).json({ message: "Location, item, required quantity, and assigned user are required" });
        }

        const qty = Number(requiredQuantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Required quantity must be a positive number" });
        }

        const id = workOrderId || `WO-${Date.now().toString().slice(-6)}`;

        // Check if ID already exists
        const exists = await WorkOrder.findOne({ workOrderId: id });
        if (exists) {
            return res.status(400).json({ message: `Work Order with ID ${id} already exists` });
        }

        const workOrder = new WorkOrder({
            workOrderId: id,
            location,
            item,
            requiredQuantity: qty,
            assignedUser,
            status: "Assigned",
            notes: notes || ""
        });

        await workOrder.save();

        // Calculate current stock & shortage for audit
        const inventoryRecords = await Inventory.find({ location, item });
        const available = inventoryRecords.reduce((sum, r) => sum + r.availableQuantity, 0);
        const shortage = Math.max(0, qty - available);

        await AuditLog.create({
            action: "WORK_ORDER_CREATED",
            module: "WORK_ORDER",
            performedBy: `${req.user.name} (${req.user.role})`,
            details: { workOrderId: id, location, item, requiredQuantity: qty, availableAtLocation: available, shortage }
        });

        return res.status(201).json({
            message: "Work order created successfully",
            workOrder,
            stockSummary: {
                requiredQuantity: qty,
                availableAtLocation: available,
                shortage
            }
        });
    } catch (error) {
        console.error("Create work order error:", error);
        return res.status(500).json({ message: "Failed to create work order", error: error.message });
    }
};

// @desc    Get all Work Orders
// @route   GET /api/work-orders
// @access  Private
export const getWorkOrders = async (req, res) => {
    try {
        const { status, location } = req.query;
        let query = {};

        if (status && status !== "All") query.status = status;
        if (location && location !== "All") query.location = location;

        const workOrders = await WorkOrder.find(query).sort({ createdAt: -1 });
        return res.json(workOrders);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch work orders", error: error.message });
    }
};

// @desc    Update Work Order status
// @route   PATCH /api/work-orders/:id/status
// @access  Private (Admin, Operations User)
export const updateWorkOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Assigned", "In Progress", "Completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const workOrder = await WorkOrder.findById(id);
        if (!workOrder) {
            return res.status(404).json({ message: "Work order not found" });
        }

        const oldStatus = workOrder.status;
        workOrder.status = status;
        await workOrder.save();

        await AuditLog.create({
            action: "WORK_ORDER_STATUS_CHANGED",
            module: "WORK_ORDER",
            performedBy: `${req.user.name} (${req.user.role})`,
            details: { workOrderId: workOrder.workOrderId, oldStatus, newStatus: status }
        });

        return res.json({ message: "Work order status updated", workOrder });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update work order", error: error.message });
    }
};
