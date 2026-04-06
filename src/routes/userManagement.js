import express from "express";
const userRouter = express.Router();
import mongoose from "mongoose";
import { User } from "../Models/user.js";
import { authenticate, authorizeRoles } from "../middleware/authWare.js";

// =========================================================
// ========= ALL ROUTES BELOW ARE ADMIN-ONLY ===============
// =========================================================
userRouter.use(authenticate, authorizeRoles("admin"));

// =============================
// ====== Fetch all Users ======
// =============================
// Get a list of all users in the system (so the Admin can see who to manage)
userRouter.get("/getAllUsers", async (req, res) => {
    try{
        // Fetch all users, but exclude their passwords for security
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } 
    catch(error){
        console.error("Get Users Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ===================================================
// ====== Change a user's role (Promote/Demote) ======
// ===================================================
userRouter.put("/changeRole/:id", async (req, res) => {
    try{
        const { id } = req.params;
        const { role } = req.body;

        // Validation Checks
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ success: false, message: "Invalid User ID format" });
        }

        const validRoles = ["viewer", "analyst", "admin"];
        if(!validRoles.includes(role)){
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        // HANDLED AN EDGE CASE: An admin should never be able to accidentally demote themselves
        if(req.user._id.toString() === id){
            return res.status(403).json({ success: false, message: "You cannot change your own role." });
        }

        // Fetch the user FIRST
        const targetUser = await User.findById(id).select("-password");
        if(!targetUser){
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if they already have this role
        if(targetUser.role === role){
            return res.status(400).json({ 
                success: false, 
                message: `User is already assigned the role of ${role}.` 
            });
        }

        // Apply the change and save
        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: `User role successfully updated to ${role}`,
            data: targetUser
        });

    } 
    catch(error){
        console.error("Update Role Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ====================================================================
// ====== Suspend or Reactivate a user account (Toggle isActive) ======
// ====================================================================
userRouter.put("/changeStatus/:id", async (req, res) => {
    try{
        const { id } = req.params;
        const { isActive } = req.body;

        // Validation Checks
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ success: false, message: "Invalid User ID format" });
        }

        if(typeof isActive !== "boolean"){
            return res.status(400).json({ success: false, message: "isActive must be a boolean (true/false)" });
        }

        // HANDLED AN EDGE CASE: An admin should never be able to accidentally suspend his/her own account
        if(req.user._id.toString() === id){
            return res.status(403).json({ success: false, message: "You cannot suspend your own account." });
        }

        // Fetch the user FIRST
        const targetUser = await User.findById(id).select("-password");
        if(!targetUser){
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the status is already what we are trying to set
        if(targetUser.isActive === isActive){
            const currentStatus = isActive ? "active" : "suspended";
            return res.status(400).json({ 
                success: false, 
                message: `User account is already ${currentStatus}.` 
            });
        }

        // Apply the change and save
        targetUser.isActive = isActive;
        await targetUser.save();

        const actionWord = isActive ? "reactivated" : "suspended";

        res.status(200).json({
            success: true,
            message: `User account successfully ${actionWord}`,
            data: targetUser
        });

    } 
    catch(error){
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default userRouter;