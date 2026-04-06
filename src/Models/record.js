import mongoose from "mongoose";
const { Schema } = mongoose;

const recordSchema = new Schema({
    amount: { 
        type: Number, 
        required: true, 
        min: [0, "Amount cannot be negative"] 
    },
    type: { 
        type: String, 
        enum: ["income", "expense"], 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true, 
        default: Date.now 
    },
    notes: { 
        type: String, 
        trim: true 
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: "users", // Reference to users collection
        required: true 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Pre-find hook to automatically exclude soft-deleted records from all find queries
// $ne: true -> This means not equal to TRUE
recordSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function() {
    this.where({ isDeleted: { $ne: true } });
});

export const Record = mongoose.model("records", recordSchema);