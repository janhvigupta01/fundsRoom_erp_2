import jwt from "jsonwebtoken";

const genToken = async (userId) => {
    try {
        const token = await jwt.sign({ userId }, process.env.JWT_SECRET || "erp_super_secret_jwt_key_2026", { expiresIn: "7d" });
        return token;
    } catch (error) {
        console.log("gen token error", error);
    }
};

export default genToken;
