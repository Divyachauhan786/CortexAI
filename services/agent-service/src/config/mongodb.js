import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Agent Service MongoDB connected");
    } catch (error) {
        console.error(
            "Agent Service MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
};

export default connectDB;