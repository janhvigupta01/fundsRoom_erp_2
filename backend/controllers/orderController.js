import CustomerOrder from "../models/CustomerOrder.js";
import Inventory from "../models/Inventory.js";
import AuditLog from "../models/AuditLog.js";

// Helper function to atomically reserve inventory stock
export const reserveStockAtomic = async ({ location, item, batch, quantity }) => {
    // Query condition: item, location, batch, AND availableQuantity >= quantity
    let query = {
        location,
        item,
        availableQuantity: { $gte: quantity }
    };
    if (batch) query.batch = batch;

    // Atomic update in MongoDB: increments reservedQuantity and decrements availableQuantity
    const updatedStock = await Inventory.findOneAndUpdate(
        query,
        {
            $inc: {
                reservedQuantity: quantity,
                availableQuantity: -quantity
            }
        },
        { new: true }
    );

    return updatedStock;
};

// @desc    Get all customer orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
    try {
        const { status, location } = req.query;
        let query = {};

        if (status && status !== "All") query.status = status;
        if (location && location !== "All") query.location = location;

        const orders = await CustomerOrder.find(query).sort({ createdAt: -1 });
        return res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch customer orders", error: error.message });
    }
};

// @desc    Create Customer Order and atomically reserve stock
// @route   POST /api/orders
// @access  Private (Sales User, Admin)
export const createOrder = async (req, res) => {
    try {
        const { orderId, customerName, location, item, batch, quantity } = req.body;

        if (!customerName || !location || !item || !quantity) {
            return res.status(400).json({ message: "Customer name, location, item, and quantity are required" });
        }

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Order quantity must be a positive number greater than 0" });
        }

        // Check if an inventory batch exists or find suitable batch
        let inventoryBatch = null;
        if (batch) {
            inventoryBatch = await Inventory.findOne({ location, item, batch });
        } else {
            // Find batch with sufficient available quantity
            inventoryBatch = await Inventory.findOne({
                location,
                item,
                availableQuantity: { $gte: qty }
            }).sort({ availableQuantity: -1 });
        }

        // Test 1: Cannot reserve more than available inventory
        if (!inventoryBatch || inventoryBatch.availableQuantity < qty) {
            const currentAvailable = inventoryBatch ? inventoryBatch.availableQuantity : 0;
            return res.status(400).json({
                message: `Cannot reserve more than available inventory. Requested: ${qty}, Available: ${currentAvailable}`,
                available: currentAvailable,
                requested: qty
            });
        }

        // Atomic Reservation at MongoDB Database Level
        // Solves the concurrency race condition (Test 1 & Two users reserving at once)
        const updatedStock = await Inventory.findOneAndUpdate(
            {
                _id: inventoryBatch._id,
                availableQuantity: { $gte: qty }
            },
            {
                $inc: {
                    reservedQuantity: qty,
                    availableQuantity: -qty
                }
            },
            { new: true }
        );

        if (!updatedStock) {
            return res.status(400).json({
                message: "Stock reservation failed: Another user reserved this stock concurrently or inventory changed.",
                requested: qty
            });
        }

        const id = orderId || `ORD-${Date.now().toString().slice(-6)}`;

        const order = new CustomerOrder({
            orderId: id,
            customerName,
            location,
            item,
            batch: updatedStock.batch,
            quantity: qty,
            status: "Reserved",
            salesUser: req.user ? `${req.user.name} (${req.user.role})` : "Sales User"
        });

        await order.save();

        await AuditLog.create({
            action: "ORDER_CREATED_AND_STOCK_RESERVED",
            module: "CUSTOMER_ORDER",
            performedBy: req.user ? `${req.user.name} (${req.user.role})` : "Sales User",
            details: {
                orderId: id,
                customerName,
                item,
                location,
                batch: updatedStock.batch,
                reservedQuantity: qty,
                newAvailableQuantity: updatedStock.availableQuantity
            }
        });

        return res.status(201).json({
            message: "Customer order created and stock reserved successfully",
            order,
            inventorySnapshot: {
                physicalQuantity: updatedStock.physicalQuantity,
                reservedQuantity: updatedStock.reservedQuantity,
                availableQuantity: updatedStock.availableQuantity
            }
        });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ message: "Failed to create order and reserve stock", error: error.message });
    }
};

// @desc    Cancel an order and release its reserved stock (Live Verification feature!)
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Sales User, Admin)
export const cancelOrderAndReleaseStock = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await CustomerOrder.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Customer order not found" });
        }

        if (order.status !== "Reserved") {
            return res.status(400).json({
                message: `Only orders in 'Reserved' status can be cancelled. Current status: '${order.status}'`
            });
        }

        // Atomically release the reserved stock back to available
        const updatedStock = await Inventory.findOneAndUpdate(
            {
                location: order.location,
                item: order.item,
                batch: order.batch
            },
            {
                $inc: {
                    reservedQuantity: -order.quantity,
                    availableQuantity: order.quantity
                }
            },
            { new: true }
        );

        order.status = "Cancelled";
        await order.save();

        await AuditLog.create({
            action: "ORDER_CANCELLED_STOCK_RELEASED",
            module: "CUSTOMER_ORDER",
            performedBy: req.user ? `${req.user.name} (${req.user.role})` : "Sales User",
            details: {
                orderId: order.orderId,
                releasedQuantity: order.quantity,
                newAvailableQuantity: updatedStock ? updatedStock.availableQuantity : "N/A"
            }
        });

        return res.json({
            message: `Order ${order.orderId} cancelled and ${order.quantity} units released back to available stock`,
            order,
            inventorySnapshot: updatedStock
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
};

// @desc    Simulate concurrent reservation test between two users (Interview Demonstration)
// @route   POST /api/orders/simulate-concurrency
// @access  Private
export const simulateConcurrency = async (req, res) => {
    try {
        const { location, item, userARequestQty, userBRequestQty } = req.body;

        const qtyA = Number(userARequestQty) || 80;
        const qtyB = Number(userBRequestQty) || 50;

        // Find initial stock
        const initialStock = await Inventory.findOne({ location, item });
        if (!initialStock) {
            return res.status(404).json({ message: `No inventory record found for ${item} at ${location}` });
        }

        const startAvailable = initialStock.availableQuantity;

        // Execute two parallel reservations simultaneously using Promise.all
        const [resultA, resultB] = await Promise.allSettled([
            Inventory.findOneAndUpdate(
                { _id: initialStock._id, availableQuantity: { $gte: qtyA } },
                { $inc: { reservedQuantity: qtyA, availableQuantity: -qtyA } },
                { new: true }
            ),
            Inventory.findOneAndUpdate(
                { _id: initialStock._id, availableQuantity: { $gte: qtyB } },
                { $inc: { reservedQuantity: qtyB, availableQuantity: -qtyB } },
                { new: true }
            )
        ]);

        const stockAfter = await Inventory.findById(initialStock._id);

        return res.json({
            scenario: `Initial Available: ${startAvailable}. User A requested ${qtyA}. User B requested ${qtyB}.`,
            userA: {
                success: resultA.status === "fulfilled" && resultA.value !== null,
                requested: qtyA,
                result: resultA.status === "fulfilled" && resultA.value !== null ? "RESERVATION_GRANTED" : "RESERVATION_DENIED"
            },
            userB: {
                success: resultB.status === "fulfilled" && resultB.value !== null,
                requested: qtyB,
                result: resultB.status === "fulfilled" && resultB.value !== null ? "RESERVATION_GRANTED" : "RESERVATION_DENIED"
            },
            explanation: "Atomic update condition { availableQuantity: { $gte: requested } } guarantees that both requests CANNOT exceed total available stock.",
            finalInventory: stockAfter
        });
    } catch (error) {
        return res.status(500).json({ message: "Concurrency simulation error", error: error.message });
    }
};
