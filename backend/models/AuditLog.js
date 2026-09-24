import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true
        },
        module: {
            type: String,
            required: true
        },
        performedBy: {
            type: String,
            required: true
        },
        details: {
            type: Object,
            default: {}
        }
    },
    { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
