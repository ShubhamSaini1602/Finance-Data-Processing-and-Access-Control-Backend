import express from "express";
const analyticsRouter = express.Router();
import { authenticate, authorizeRoles } from "../middleware/authWare.js";
import { getDashboardSummary } from "../utils/analytics.js";

// =========================================================
// ========= Get Dashboard Summary: All Logged-in Users ====
// =========================================================
analyticsRouter.get("/summary", authenticate, authorizeRoles("viewer", "analyst", "admin"), async(req, res) => {
    try{
        const summaryData = await getDashboardSummary(req.user._id);

        res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: summaryData
        });

    } 
    catch(error){
        console.error("Analytics Summary Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default analyticsRouter;