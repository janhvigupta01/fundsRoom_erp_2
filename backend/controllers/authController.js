import User from "../models/User.js";
import genToken from "../utils/genToken.js";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = await genToken(user._id);

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                token
            });
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all users (for assigning tasks/orders)
// @route   GET /api/auth/users
// @access  Private
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ name: 1 });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public / Admin
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, location } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "Operations User",
            location: location || "Warehouse Mumbai"
        });

        const token = await genToken(user._id);

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
            token
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};
