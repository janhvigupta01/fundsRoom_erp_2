import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDb from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import workOrderRoutes from "./routes/workOrderRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
if (process.env.NODE_ENV !== "test") {
    connectDb();
}

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/audit", auditRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString(), service: "Mini Operations ERP API" });
});

// Serve frontend static build in production
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
        if (err) {
            res.status(200).send("Mini Operations ERP Backend API is running. Build frontend to view UI.");
        }
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Mini Operations ERP Server running on port ${PORT}`);
    });
}

export default app;
