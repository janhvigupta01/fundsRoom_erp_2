import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/mini_operations_erp";
        await mongoose.connect(mongoUrl);
        console.log("Db connected successfully");
    }
    catch (error) {
        console.log(error);
        console.log("db failed");
    }
};

export default connectDb;
