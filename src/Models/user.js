import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName : {
        type:String,
        required:true,
        minLength:3,
        maxLength:20
    },
    lastName : {
        type:String,
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ["viewer", "analyst", "admin"], 
        default: "viewer" 
    },
    // Whether the user account is currently enabled and allowed to access the system
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

export const User = mongoose.model("users", userSchema);