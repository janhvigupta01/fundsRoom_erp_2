import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Inventory from "./models/Inventory.js";
import WorkOrder from "./models/WorkOrder.js";
import StockTransfer from "./models/StockTransfer.js";
import CustomerOrder from "./models/CustomerOrder.js";
import AuditLog from "./models/AuditLog.js";
import connectDb from "./config/db.js";

dotenv.config();

const seedDatabase = async () => {
    try {
        await connectDb();

        console.log("Clearing existing ERP data...");
        await User.deleteMany({});
        await Inventory.deleteMany({});
        await WorkOrder.deleteMany({});
        await StockTransfer.deleteMany({});
        await CustomerOrder.deleteMany({});
        await AuditLog.deleteMany({});

        console.log("Seeding Users...");
        const users = await User.create([
            {
                name: "Janhavi (Admin)",
                email: "admin@erp.com",
                password: "admin123",
                role: "Admin",
                location: "Warehouse Mumbai"
            },
            {
                name: "Rahul Sharma (Ops)",
                email: "ops@erp.com",
                password: "ops123",
                role: "Operations User",
                location: "Warehouse Mumbai"
            },
            {
                name: "Pooja Verma (Sales)",
                email: "sales@erp.com",
                password: "sales123",
                role: "Sales User",
                location: "Warehouse Mumbai"
            }
        ]);

        console.log("Seeding Multi-Location Inventory...");
        const inventories = await Inventory.create([
            {
                item: "Steel Rods",
                category: "Raw Material",
                location: "Warehouse Mumbai",
                batch: "BATCH-MUM-01",
                physicalQuantity: 100,
                reservedQuantity: 30,
                availableQuantity: 70
            },
            {
                item: "Electric Motors",
                category: "Machinery",
                location: "Warehouse Mumbai",
                batch: "BATCH-MUM-02",
                physicalQuantity: 60,
                reservedQuantity: 0,
                availableQuantity: 60
            },
            {
                item: "Microcontrollers",
                category: "Electronics",
                location: "Warehouse Mumbai",
                batch: "BATCH-MUM-03",
                physicalQuantity: 150,
                reservedQuantity: 20,
                availableQuantity: 130
            },
            {
                item: "Steel Rods",
                category: "Raw Material",
                location: "Plant Pune",
                batch: "BATCH-PUN-01",
                physicalQuantity: 200,
                reservedQuantity: 0,
                availableQuantity: 200
            },
            {
                item: "Copper Wire",
                category: "Electrical",
                location: "Plant Pune",
                batch: "BATCH-PUN-02",
                physicalQuantity: 120,
                reservedQuantity: 10,
                availableQuantity: 110
            },
            {
                item: "Steel Rods",
                category: "Raw Material",
                location: "Delhi Hub",
                batch: "BATCH-DEL-01",
                physicalQuantity: 80,
                reservedQuantity: 0,
                availableQuantity: 80
            },
            {
                item: "Electric Motors",
                category: "Machinery",
                location: "Delhi Hub",
                batch: "BATCH-DEL-02",
                physicalQuantity: 40,
                reservedQuantity: 15,
                availableQuantity: 25
            }
        ]);

        console.log("Seeding Work Orders...");
        await WorkOrder.create([
            {
                workOrderId: "WO-1001",
                location: "Warehouse Mumbai",
                item: "Steel Rods",
                requiredQuantity: 100,
                assignedUser: "Rahul Sharma (Ops)",
                status: "In Progress",
                notes: "Fabrication batch for Q3 client shipment"
            },
            {
                workOrderId: "WO-1002",
                location: "Plant Pune",
                item: "Copper Wire",
                requiredQuantity: 50,
                assignedUser: "Janhavi (Admin)",
                status: "Assigned",
                notes: "Motor coil winding operation"
            }
        ]);

        console.log("Seeding Internal Stock Transfers...");
        await StockTransfer.create([
            {
                transferId: "TRF-2001",
                sourceLocation: "Plant Pune",
                destinationLocation: "Warehouse Mumbai",
                item: "Steel Rods",
                batch: "BATCH-PUN-01",
                quantity: 40,
                status: "Requested",
                requestedBy: "Rahul Sharma (Ops)"
            }
        ]);

        console.log("Seeding Customer Orders...");
        await CustomerOrder.create([
            {
                orderId: "ORD-3001",
                customerName: "Tata Motors Ltd",
                location: "Warehouse Mumbai",
                item: "Steel Rods",
                batch: "BATCH-MUM-01",
                quantity: 30,
                status: "Reserved",
                salesUser: "Pooja Verma (Sales)"
            },
            {
                orderId: "ORD-3002",
                customerName: "Schneider Electric",
                location: "Warehouse Mumbai",
                item: "Microcontrollers",
                batch: "BATCH-MUM-03",
                quantity: 20,
                status: "Reserved",
                salesUser: "Pooja Verma (Sales)"
            }
        ]);

        console.log("Seeding Audit Log...");
        await AuditLog.create({
            action: "SYSTEM_INITIALIZED",
            module: "SYSTEM",
            performedBy: "System Seeder",
            details: { message: "Initial database seed completed successfully" }
        });

        console.log("Database seeded successfully!");
        console.log("-----------------------------------------");
        console.log("DEMO USERS:");
        console.log("Admin:      admin@erp.com / admin123");
        console.log("Operations: ops@erp.com   / ops123");
        console.log("Sales:      sales@erp.com / sales123");
        console.log("-----------------------------------------");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedDatabase();
