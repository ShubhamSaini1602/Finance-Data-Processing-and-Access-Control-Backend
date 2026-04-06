import express from "express";
const recordRouter = express.Router();
import mongoose from "mongoose";
import { Record } from "../Models/record.js";
import { validateCreateRecord, validateUpdateRecord } from "../utils/validateRecord.js";
import { authenticate, authorizeRoles } from "../middleware/authWare.js";

// =============================================
// ========= Create Record: Admin Only =========
// =============================================
recordRouter.post("/createRecord", authenticate, authorizeRoles("admin"), async(req,res) => {
    // Validation Check First
    try{
        validateCreateRecord(req.body);
    } 
    catch(validationError){
        return res.status(400).json({ success: false, message: validationError.message });
    }

    // Business Logic
    try{
        const recordData = {
            ...req.body,
            createdBy: req.user._id // Automatically attach the logged-in user's ID
        };

        const newRecord = await Record.create(recordData);

        res.status(201).json({
            success: true,
            message: "Record created successfully",
            data: newRecord
        });
    } 
    catch(error){
        console.error("Create Record Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// =================================================
// ========= Get Records: Analysts, Admins =========
// =================================================
// /getRecords?page=2&limit=5&type=expense&category=food&startDate=2026-04-01&endDate=2026-04-30
// limit = how many records to return on one page
// page = which page of records you want
recordRouter.get("/getRecords", authenticate, authorizeRoles("analyst", "admin"), async(req,res) => {
    try {
        const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;

        // Creates an empty object that will later be used to search the database
        const query = {};
        
        if(type){
            query.type = type;
        }
        if(category){
            query.category = category;
        }
        
        // Date Range Filtering
        if(startDate || endDate){
            query.date = {};
            if(startDate){
                query.date.$gte = new Date(startDate);
            }
            if(endDate){
                query.date.$lte = new Date(endDate);
            }
        }

        // Pagination Math
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute DB Queries in parallel for speed
        const [records, total] = await Promise.all([
            Record.find(query)
                .sort({ date: -1 })       // Sorts records by date descending (Newest first)
                .skip(skip)               // Skips the calculated number of records (Useful for pagination)
                .limit(parseInt(limit))   // Returns only the requested number of records
                .populate("createdBy", "firstName lastName email"), // Join user data cleanly
            Record.countDocuments(query)  // Counts how many total records match the query (This is needed so the frontend knows: Total pages)
        ]);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: parseInt(page),              // Current page number
                pages: Math.ceil(total / limit)    // Calculates total pages
            },
            data: records
        });
    } 
    catch(error){
        console.error("Get Records Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// =============================================
// ========= Update Record: Admin Only =========
// =============================================
recordRouter.put("/updateRecord/:id", authenticate, authorizeRoles("admin"), async(req,res) => {
    // Validation Check First
    try{
        validateUpdateRecord(req.body);
    } 
    catch(validationError){
        return res.status(400).json({ success: false, message: validationError.message });
    }

    // Business Logic
    try{
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ success: false, message: "Invalid Record ID format" });
        }

        const updatedRecord = await Record.findByIdAndUpdate(
            id,
            { $set: req.body },                  // $set updates only the fields sent in the request body
            { new: true, runValidators: true }
        );

        if(!updatedRecord){
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Record updated successfully",
            data: updatedRecord
        });
    } 
    catch(error){
        console.error("Update Record Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// =============================================
// ========= Delete Record: Admin Only =========
// =============================================
recordRouter.delete("/deleteRecord/:id", authenticate, authorizeRoles("admin"), async(req,res) => {
    try{
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ success: false, message: "Invalid Record ID format" });
        }

        // SOFT DELETION: Instead of permanently deleting the record, it updates -> isDeleted TO True
        // The user thinks it's gone, but we still have it in the database, and because of our pre-find hook
        // we made in our record Schema, these deleted records will no longer appear in our normal find queries
        const record = await Record.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

        if(!record){
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Record deleted successfully" 
        });
    } 
    catch(error){
        console.error("Delete Record Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default recordRouter;

