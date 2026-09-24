import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/User.js";
import Inventory from "../models/Inventory.js";
import StockTransfer from "../models/StockTransfer.js";
import CustomerOrder from "../models/CustomerOrder.js";

let adminToken;
let opsToken;
let salesToken;

beforeAll(async () => {
    // Connect to database for tests
    const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/mini_operations_erp";
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUrl);
    }

    // Login each demo role to obtain JWT tokens
    const adminRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@erp.com", password: "admin123" });
    adminToken = adminRes.body.token;

    const opsRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "ops@erp.com", password: "ops123" });
    opsToken = opsRes.body.token;

    const salesRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "sales@erp.com", password: "sales123" });
    salesToken = salesRes.body.token;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Mini Operations ERP - Mandatory Assignment Tests", () => {

    /**
     * TEST 1: Cannot reserve more than available inventory.
     * Example: Available = 50, Sales user attempts to reserve 100 -> Must return 400 error.
     */
    test("Test 1: Cannot reserve more than available inventory", async () => {
        // Prepare an isolated item for this test
        const testItem = "Test-Item-Test1";
        const testBatch = "BATCH-T1";
        const location = "Warehouse Mumbai";

        await Inventory.deleteMany({ item: testItem });

        // Create inventory: Physical = 50, Reserved = 0, Available = 50
        await Inventory.create({
            item: testItem,
            category: "Testing",
            location,
            batch: testBatch,
            physicalQuantity: 50,
            reservedQuantity: 0,
            availableQuantity: 50
        });

        // Sales user attempts to reserve 75 (which is > 50 available)
        const res = await request(app)
            .post("/api/orders")
            .set("Authorization", `Bearer ${salesToken}`)
            .send({
                customerName: "Acme Corp",
                location,
                item: testItem,
                batch: testBatch,
                quantity: 75
            });

        // Assertion: Must be rejected with 400 Bad Request
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Cannot reserve more than available inventory/i);

        // Verify database state: Reserved remains 0 and Available remains 50
        const inv = await Inventory.findOne({ item: testItem, batch: testBatch });
        expect(inv.reservedQuantity).toBe(0);
        expect(inv.availableQuantity).toBe(50);
    });

    /**
     * TEST 2: Cannot transfer more than available inventory.
     * Example: Source available = 40, transfer requested = 80 -> Must return 400 error.
     */
    test("Test 2: Cannot transfer more than available inventory", async () => {
        const testItem = "Test-Item-Test2";
        const testBatch = "BATCH-T2";
        const sourceLoc = "Plant Pune";
        const destLoc = "Warehouse Mumbai";

        await Inventory.deleteMany({ item: testItem });

        // Create source inventory with 40 available
        await Inventory.create({
            item: testItem,
            category: "Testing",
            location: sourceLoc,
            batch: testBatch,
            physicalQuantity: 40,
            reservedQuantity: 0,
            availableQuantity: 40
        });

        // Attempt transfer of 90 units (> 40)
        const res = await request(app)
            .post("/api/transfers")
            .set("Authorization", `Bearer ${opsToken}`)
            .send({
                sourceLocation: sourceLoc,
                destinationLocation: destLoc,
                item: testItem,
                batch: testBatch,
                quantity: 90
            });

        // Assertion: Must be rejected
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Cannot transfer more than available inventory/i);
    });

    /**
     * TEST 3: Destination stock increases only after transfer receipt.
     * Flow:
     * 1. Create source inventory = 100, dest inventory = 0
     * 2. Request transfer of 30
     * 3. Dispatch transfer -> Source becomes 70. Dest must STILL be 0!
     * 4. Receive transfer -> Dest now becomes 30!
     */
    test("Test 3: Destination stock increases only after transfer receipt", async () => {
        const testItem = "Test-Item-Test3";
        const testBatch = "BATCH-T3";
        const sourceLoc = "Plant Pune";
        const destLoc = "Delhi Hub";

        await Inventory.deleteMany({ item: testItem });
        await StockTransfer.deleteMany({ item: testItem });

        // Source stock = 100
        await Inventory.create({
            item: testItem,
            category: "Testing",
            location: sourceLoc,
            batch: testBatch,
            physicalQuantity: 100,
            reservedQuantity: 0,
            availableQuantity: 100
        });

        // 1. Create transfer of 30 units
        const createRes = await request(app)
            .post("/api/transfers")
            .set("Authorization", `Bearer ${opsToken}`)
            .send({
                sourceLocation: sourceLoc,
                destinationLocation: destLoc,
                item: testItem,
                batch: testBatch,
                quantity: 30
            });
        expect(createRes.statusCode).toBe(201);
        const transferId = createRes.body.transfer._id;

        // 2. Dispatch the transfer
        const dispatchRes = await request(app)
            .patch(`/api/transfers/${transferId}/dispatch`)
            .set("Authorization", `Bearer ${opsToken}`);
        expect(dispatchRes.statusCode).toBe(200);

        // Check source stock: decreased from 100 to 70
        const sourceAfterDispatch = await Inventory.findOne({ location: sourceLoc, item: testItem });
        expect(sourceAfterDispatch.physicalQuantity).toBe(70);

        // Check destination stock: MUST NOT INCREASE BEFORE RECEIPT!
        const destBeforeReceipt = await Inventory.findOne({ location: destLoc, item: testItem });
        expect(destBeforeReceipt).toBeNull(); // Still 0 / not created

        // 3. Receive the transfer
        const receiveRes = await request(app)
            .patch(`/api/transfers/${transferId}/receive`)
            .set("Authorization", `Bearer ${opsToken}`);
        expect(receiveRes.statusCode).toBe(200);

        // Now Destination stock MUST increase to 30
        const destAfterReceipt = await Inventory.findOne({ location: destLoc, item: testItem });
        expect(destAfterReceipt).not.toBeNull();
        expect(destAfterReceipt.physicalQuantity).toBe(30);
        expect(destAfterReceipt.availableQuantity).toBe(30);
    });

    /**
     * TEST 4: Same transfer cannot be received twice.
     * Calling receive on an already received transfer must fail with 400 error.
     */
    test("Test 4: Same transfer cannot be received twice", async () => {
        const testItem = "Test-Item-Test4";
        const testBatch = "BATCH-T4";
        const sourceLoc = "Warehouse Mumbai";
        const destLoc = "Plant Pune";

        await Inventory.deleteMany({ item: testItem });
        await StockTransfer.deleteMany({ item: testItem });

        await Inventory.create({
            item: testItem,
            category: "Testing",
            location: sourceLoc,
            batch: testBatch,
            physicalQuantity: 50,
            reservedQuantity: 0,
            availableQuantity: 50
        });

        // Create & Dispatch transfer
        const createRes = await request(app)
            .post("/api/transfers")
            .set("Authorization", `Bearer ${opsToken}`)
            .send({
                sourceLocation: sourceLoc,
                destinationLocation: destLoc,
                item: testItem,
                batch: testBatch,
                quantity: 20
            });
        const transferId = createRes.body.transfer._id;

        await request(app)
            .patch(`/api/transfers/${transferId}/dispatch`)
            .set("Authorization", `Bearer ${opsToken}`);

        // First receipt: SUCCESS
        const firstReceive = await request(app)
            .patch(`/api/transfers/${transferId}/receive`)
            .set("Authorization", `Bearer ${opsToken}`);
        expect(firstReceive.statusCode).toBe(200);

        // Second receipt attempt: MUST FAIL!
        const secondReceive = await request(app)
            .patch(`/api/transfers/${transferId}/receive`)
            .set("Authorization", `Bearer ${opsToken}`);
        expect(secondReceive.statusCode).toBe(400);
        expect(secondReceive.body.message).toMatch(/cannot be received twice/i);
    });

    /**
     * TEST 5: Unauthorized user cannot perform restricted operation.
     * Examples:
     * - Sales User cannot create Work Orders (Admin only)
     * - Sales User cannot create Stock Transfers (Ops & Admin only)
     */
    test("Test 5: Unauthorized user cannot perform restricted operation", async () => {
        // Sales user trying to create a Work Order (Restricted to Admin)
        const woRes = await request(app)
            .post("/api/work-orders")
            .set("Authorization", `Bearer ${salesToken}`)
            .send({
                location: "Warehouse Mumbai",
                item: "Steel Rods",
                requiredQuantity: 20,
                assignedUser: "Pooja Verma"
            });

        expect(woRes.statusCode).toBe(403);
        expect(woRes.body.message).toMatch(/Forbidden/i);

        // Sales user trying to create a Stock Transfer (Restricted to Ops & Admin)
        const trfRes = await request(app)
            .post("/api/transfers")
            .set("Authorization", `Bearer ${salesToken}`)
            .send({
                sourceLocation: "Warehouse Mumbai",
                destinationLocation: "Plant Pune",
                item: "Steel Rods",
                quantity: 10
            });

        expect(trfRes.statusCode).toBe(403);
        expect(trfRes.body.message).toMatch(/Forbidden/i);
    });

});
