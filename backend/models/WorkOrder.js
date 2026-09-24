import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
    {
        workOrderId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true
        },
        item: {
            type: String,
            required: [true, "Item name is required"],
            trim: true
        },
        requiredQuantity: {
            type: Number,
            required: [true, "Required quantity is required"],
            min: [1, "Required quantity must be at least 1"]
        },
        assignedUser: {
            type: String,
            required: [true, "Assigned user is required"],
            trim: true
        },
        status: {
            type: String,
            enum: ["Assigned", "In Progress", "Completed"],
            default: "Assigned"
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);
export default WorkOrder;
