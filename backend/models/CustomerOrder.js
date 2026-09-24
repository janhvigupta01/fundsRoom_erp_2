import mongoose from "mongoose";

const customerOrderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        customerName: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },
        location: {
            type: String,
            required: [true, "Location is required"],
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
            required: [true, "Order quantity is required"],
            min: [1, "Order quantity must be at least 1"]
        },
        status: {
            type: String,
            enum: ["Reserved", "Fulfilled", "Cancelled"],
            default: "Reserved"
        },
        salesUser: {
            type: String,
            default: "Sales User"
        }
    },
    { timestamps: true }
);

const CustomerOrder = mongoose.model("CustomerOrder", customerOrderSchema);
export default CustomerOrder;
