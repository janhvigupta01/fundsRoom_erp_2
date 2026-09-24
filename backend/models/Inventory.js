import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
    {
        item: {
            type: String,
            required: [true, "Item name is required"],
            trim: true
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true
        },
        batch: {
            type: String,
            required: [true, "Batch number is required"],
            trim: true
        },
        physicalQuantity: {
            type: Number,
            required: [true, "Physical quantity is required"],
            min: [0, "Physical quantity cannot be negative"]
        },
        reservedQuantity: {
            type: Number,
            default: 0,
            min: [0, "Reserved quantity cannot be negative"]
        },
        availableQuantity: {
            type: Number,
            default: 0,
            min: [0, "Available quantity cannot be negative"]
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Compound index to ensure uniqueness for item + location + batch
inventorySchema.index({ item: 1, location: 1, batch: 1 }, { unique: true });

// Pre-save hook to calculate availableQuantity and validate
inventorySchema.pre("save", function (next) {
    if (this.reservedQuantity > this.physicalQuantity) {
        return next(new Error("Reserved quantity cannot exceed physical quantity"));
    }
    this.availableQuantity = this.physicalQuantity - this.reservedQuantity;
    next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
