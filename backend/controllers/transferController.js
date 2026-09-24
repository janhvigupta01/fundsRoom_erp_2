import StockTransfer from "../models/StockTransfer.js";
import Inventory from "../models/Inventory.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Get all stock transfers
// @route   GET /api/transfers
// @access  Private
export const getTransfers = async (req, res) => {
    try {
        const { status, sourceLocation, destinationLocation } = req.query;
        let query = {};

        if (status && status !== "All") query.status = status;
        if (sourceLocation && sourceLocation !== "All") query.sourceLocation = sourceLocation;
        if (destinationLocation && destinationLocation !== "All") query.destinationLocation = destinationLocation;

        const transfers = await StockTransfer.find(query).sort({ createdAt: -1 });
        return res.json(transfers);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch transfers", error: error.message });
    }
};

// @desc    Create a new Stock Transfer request
// @route   POST /api/transfers
// @access  Private (Operations User, Admin)
export const createTransfer = async (req, res) => {
    try {
        const { transferId, sourceLocation, destinationLocation, item, batch, quantity } = req.body;

        if (!sourceLocation || !destinationLocation || !item || !quantity) {
            return res.status(400).json({ message: "Source location, destination location, item, and quantity are required" });
        }

        if (sourceLocation === destinationLocation) {
            return res.status(400).json({ message: "Source and destination locations cannot be the same" });
        }

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number greater than 0" });
        }

        // Test 2 Requirement: Cannot transfer more than available inventory
        // Check source inventory available stock
        const sourceInventoryQuery = { location: sourceLocation, item };
        if (batch) sourceInventoryQuery.batch = batch;

        const sourceRecords = await Inventory.find(sourceInventoryQuery);
        const totalAvailableSource = sourceRecords.reduce((sum, r) => sum + r.availableQuantity, 0);

        if (totalAvailableSource < qty) {
            return res.status(400).json({
                message: `Cannot transfer more than available inventory. Available at ${sourceLocation}: ${totalAvailableSource}, Requested: ${qty}`,
                available: totalAvailableSource,
                requested: qty
            });
        }

        const selectedBatch = batch || (sourceRecords[0] ? sourceRecords[0].batch : "DEFAULT-BATCH");
        const id = transferId || `TRF-${Date.now().toString().slice(-6)}`;

        // Verify ID uniqueness
        const exists = await StockTransfer.findOne({ transferId: id });
        if (exists) {
            return res.status(400).json({ message: `Transfer ID ${id} already exists` });
        }

        const transfer = new StockTransfer({
            transferId: id,
            sourceLocation,
            destinationLocation,
            item,
            batch: selectedBatch,
            quantity: qty,
            status: "Requested",
            requestedBy: req.user ? `${req.user.name} (${req.user.role})` : "Operations User"
        });

        await transfer.save();

        await AuditLog.create({
            action: "TRANSFER_REQUESTED",
            module: "STOCK_TRANSFER",
            performedBy: req.user ? `${req.user.name} (${req.user.role})` : "Operations User",
            details: { transferId: id, sourceLocation, destinationLocation, item, batch: selectedBatch, quantity: qty }
        });

        return res.status(201).json({
            message: "Transfer requested successfully",
            transfer
        });
    } catch (error) {
        console.error("Create transfer error:", error);
        return res.status(500).json({ message: "Failed to create transfer", error: error.message });
    }
};

// @desc    Dispatch a stock transfer
// @route   PATCH /api/transfers/:id/dispatch
// @access  Private (Operations User, Admin)
// Rule: On Dispatch, Source inventory reduces. Destination inventory must NOT increase.
export const dispatchTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        const transfer = await StockTransfer.findById(id);
        if (!transfer) {
            return res.status(404).json({ message: "Transfer record not found" });
        }

        if (transfer.status !== "Requested") {
            return res.status(400).json({
                message: `Cannot dispatch transfer in '${transfer.status}' status. Must be in 'Requested' status.`
            });
        }

        // Atomic check & reduce source inventory
        // Ensures available stock hasn't dropped since requested (Test 2 safety)
        const updatedSourceStock = await Inventory.findOneAndUpdate(
            {
                location: transfer.sourceLocation,
                item: transfer.item,
                batch: transfer.batch,
                availableQuantity: { $gte: transfer.quantity }
            },
            {
                $inc: {
                    physicalQuantity: -transfer.quantity,
                    availableQuantity: -transfer.quantity
                }
            },
            { new: true }
        );

        if (!updatedSourceStock) {
            // Check if item exists under another batch or insufficient stock
            return res.status(400).json({
                message: `Cannot transfer more than available inventory. Source location ${transfer.sourceLocation} does not have sufficient available stock for batch ${transfer.batch}.`
            });
        }

        // Update transfer status to Dispatched
        transfer.status = "Dispatched";
        transfer.dispatchedAt = new Date();
        await transfer.save();

        // Note: Destination inventory is intentionally NOT increased here!
        // (Satisfies Test 3: Destination stock increases only after transfer receipt).

        await AuditLog.create({
            action: "TRANSFER_DISPATCHED",
            module: "STOCK_TRANSFER",
            performedBy: req.user ? `${req.user.name} (${req.user.role})` : "Operations User",
            details: {
                transferId: transfer.transferId,
                sourceLocation: transfer.sourceLocation,
                destinationLocation: transfer.destinationLocation,
                quantity: transfer.quantity,
                reducedSourceRemaining: updatedSourceStock.physicalQuantity
            }
        });

        return res.json({
            message: "Transfer dispatched successfully. Source inventory reduced.",
            transfer,
            sourceInventory: updatedSourceStock
        });
    } catch (error) {
        console.error("Dispatch transfer error:", error);
        return res.status(500).json({ message: "Failed to dispatch transfer", error: error.message });
    }
};

// @desc    Receive a stock transfer
// @route   PATCH /api/transfers/:id/receive
// @access  Private (Operations User, Admin)
// Rule: On Receipt, Destination inventory increases. Prevent same transfer from being received twice.
export const receiveTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        // Atomic find & update on transfer status:
        // Only allow if status is currently "Dispatched"!
        // If already "Received", this query returns null (Test 4: Same transfer cannot be received twice)
        const transfer = await StockTransfer.findOneAndUpdate(
            { _id: id, status: "Dispatched" },
            {
                $set: {
                    status: "Received",
                    receivedAt: new Date()
                }
            },
            { new: true }
        );

        if (!transfer) {
            // Check why it failed
            const checkTransfer = await StockTransfer.findById(id);
            if (!checkTransfer) {
                return res.status(404).json({ message: "Transfer record not found" });
            }
            if (checkTransfer.status === "Received") {
                return res.status(400).json({
                    message: "Invalid action: Same transfer cannot be received twice."
                });
            }
            if (checkTransfer.status === "Requested") {
                return res.status(400).json({
                    message: "Cannot receive transfer before it has been dispatched from source location."
                });
            }
            return res.status(400).json({ message: "Cannot receive this transfer in its current state." });
        }

        // Get category info from source item or inventory
        const existingItemRef = await Inventory.findOne({ item: transfer.item });
        const category = existingItemRef ? existingItemRef.category : "General";

        // Safely update or create inventory at destination
        let destStock = await Inventory.findOne({
            location: transfer.destinationLocation,
            item: transfer.item,
            batch: transfer.batch
        });

        if (destStock) {
            destStock.physicalQuantity += transfer.quantity;
            destStock.availableQuantity = destStock.physicalQuantity - destStock.reservedQuantity;
            await destStock.save();
        } else {
            destStock = await Inventory.create({
                item: transfer.item,
                category,
                location: transfer.destinationLocation,
                batch: transfer.batch,
                physicalQuantity: transfer.quantity,
                reservedQuantity: 0,
                availableQuantity: transfer.quantity
            });
        }

        await AuditLog.create({
            action: "TRANSFER_RECEIVED",
            module: "STOCK_TRANSFER",
            performedBy: req.user ? `${req.user.name} (${req.user.role})` : "Operations User",
            details: {
                transferId: transfer.transferId,
                destinationLocation: transfer.destinationLocation,
                quantity: transfer.quantity,
                destNewPhysical: destStock.physicalQuantity
            }
        });

        return res.json({
            message: "Transfer received successfully. Destination inventory increased.",
            transfer,
            destinationInventory: destStock
        });
    } catch (error) {
        console.error("Receive transfer error:", error);
        return res.status(500).json({ message: "Failed to receive transfer", error: error.message });
    }
};
