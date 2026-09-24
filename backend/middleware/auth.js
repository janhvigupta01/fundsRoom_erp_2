import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "erp_super_secret_jwt_key_2026");

            // Attach user to request object (excluding password)
            req.user = await User.findById(decoded.userId).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "User not found with this token" });
            }

            next();
        } catch (error) {
            console.error("Auth middleware error:", error.message);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }
};

// Role-based authorization middleware
// Example: authorizeRoles("Admin", "Operations User")
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden: Role '${req.user ? req.user.role : "Unknown"}' is not authorized to perform this operation. Allowed: [${roles.join(", ")}]`
            });
        }
        next();
    };
};
