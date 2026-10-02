import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Password is required for normal email/password accounts,
        // but optional for Google/Firebase accounts.
        password: {
            type: String,
            minlength: 6,
            default: null,
        },

        // Firebase UID for Google authenticated users
        firebaseUid: {
            type: String,
            unique: true,
            sparse: true,
        },

        avatar: {
            type: String,
            default: "",
        },

        credits: {
            type: Number,
            default: 100,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;