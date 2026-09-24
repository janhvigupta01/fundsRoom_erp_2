import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema(
    {
        transferId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        sourceLocation: {
            type: String,
            required: [true, "Source location is required"],
            trim: true
        },
        destinationLocation: {
            type: String,
            required: [true, "Destination location is required"],
            trim: true
        },
        item: {
            type: String,
            required: [true, "Item is required"],
            trim: true
        },
        batch: {
            type: String,
            default: "DEFAULT-BATCH",
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, "Transfer quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },
        status: {
            type: String,
            enum: ["Requested", "Dispatched", "Received"],
            default: "Requested"
        },
        requestedBy: {
            type: String,
            default: "Operations User"
        },
        dispatchedAt: {
            type: Date
        },
        receivedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);
export default StockTransfer;
