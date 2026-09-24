import Inventory from "../models/Inventory.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Get all inventory with filtering & search
// @route   GET /api/inventory
// @access  Private (All authenticated roles)
export const getInventory = async (req, res) => {
    try {
        const { location, category, item, search } = req.query;
        let query = {};

        if (location && location !== "All") {
            query.location = location;
        }
        if (category && category !== "All") {
            query.category = category;
        }
        if (item && item !== "All") {
            query.item = item;
        }
        if (search) {
            query.$or = [
                { item: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { batch: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }

        const items = await Inventory.find(query).sort({ item: 1, location: 1 });

        // Calculate summary metrics across filtered inventory
        const summary = items.reduce(
            (acc, curr) => {
                acc.totalPhysical += curr.physicalQuantity;
                acc.totalReserved += curr.reservedQuantity;
                acc.totalAvailable += curr.availableQuantity;
                return acc;
            },
            { totalPhysical: 0, totalReserved: 0, totalAvailable: 0, count: items.length }
        );

        return res.json({ items, summary });
    } catch (error) {
        console.error("Get inventory error:", error);
        return res.status(500).json({ message: "Error fetching inventory", error: error.message });
    }
};

// @desc    Add new inventory item or increase physical stock
// @route   POST /api/inventory
// @access  Private (Operations User, Admin)
export const addOrUpdateStock = async (req, res) => {
    try {
        const { item, category, location, batch, physicalQuantity } = req.body;

        // Validation
        if (!item || !category || !location || !batch) {
            return res.status(400).json({ message: "All fields (item, category, location, batch) are required" });
        }

        const quantityNumber = Number(physicalQuantity);
        if (isNaN(quantityNumber) || quantityNumber <= 0) {
            return res.status(400).json({ message: "Physical quantity must be a positive number greater than 0" });
        }

        // Check if an inventory record for this item + location + batch already exists
        let inventoryRecord = await Inventory.findOne({ item, location, batch });

        if (inventoryRecord) {
            // Update existing stock safely
            inventoryRecord.physicalQuantity += quantityNumber;
            inventoryRecord.availableQuantity = inventoryRecord.physicalQuantity - inventoryRecord.reservedQuantity;
            await inventoryRecord.save();

            await AuditLog.create({
                action: "STOCK_UPDATED",
                module: "INVENTORY",
                performedBy: req.user ? `${req.user.name} (${req.user.role})` : "System",
                details: { item, location, batch, added: quantityNumber, newTotal: inventoryRecord.physicalQuantity }
            });

            return res.status(200).json({
                message: `Added ${quantityNumber} units to existing stock`,
                inventory: inventoryRecord
            });
        } else {
            // Create new inventory record
            const newRecord = new Inventory({
                item,
                category,
                location,
                batch,
                physicalQuantity: quantityNumber,
                reservedQuantity: 0,
                availableQuantity: quantityNumber
            });

            await newRecord.save();

            await AuditLog.create({
                action: "NEW_STOCK_CREATED",
                module: "INVENTORY",
                performedBy: req.user ? `${req.user.name} (${req.user.role})` : "System",
                details: { item, category, location, batch, quantity: quantityNumber }
            });

            return res.status(201).json({
                message: "New inventory batch successfully created",
                inventory: newRecord
            });
        }
    } catch (error) {
        console.error("Add inventory error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Duplicate inventory transaction. Batch already exists for this location and item." });
        }
        return res.status(500).json({ message: "Failed to add inventory", error: error.message });
    }
};

// @desc    Get metadata: list of distinct locations, items, categories
// @route   GET /api/inventory/metadata
// @access  Private
export const getInventoryMetadata = async (req, res) => {
    try {
        const locations = await Inventory.distinct("location");
        const items = await Inventory.distinct("item");
        const categories = await Inventory.distinct("category");

        return res.json({
            locations: locations.length ? locations : ["Warehouse Mumbai", "Plant Pune", "Delhi Hub"],
            items: items.length ? items : ["Steel Rods", "Copper Wire", "Microcontrollers", "Electric Motors"],
            categories: categories.length ? categories : ["Raw Material", "Electronics", "Hardware"]
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching metadata", error: error.message });
    }
};
