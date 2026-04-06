import jwt from "jsonwebtoken";
import { User } from "../Models/user.js";
import redisClient from "../config/redis.js";

// Verify Token
export const authenticate = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token){
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Redis BlackList Functionality
        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked){
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        // --------------------

        const { _id } = payload;
        if(!_id){
            throw new Error("Id is Missing");
        }
        const user = await User.findById(_id).select("-password");
        if(!user){
            throw new Error("User Doesn't Exist");
        }

        /* In a company, if a user is caught doing something suspicious, an Admin won't 
            delete their account right away (because of audit logs). Instead, the Admin will flip isActive to false.
            Right now, if a user gets deactivated, their token will still work until it 
            expires because the user still exists in the database. So, we have to solve this EDGE CASE ->
        */
        if (!user.isActive) {
            // If an admin disables an account, that user gets locked out on their very next API request, 
            // even if their token is valid for another 24 hours.
            return res.status(403).json({ 
                success: false, 
                message: "Account suspended. Please contact support." 
            });
        }

        req.user = user;
        next();
    } 
    catch (error) {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// This function restricts routes based on user roles
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // (!req.user) -> If req.user does not exist, the user is not authenticated
        // (!allowedRoles.includes(req.user.role)) -> Checks if the user's role is not in the allowed roles list
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: Insufficient permissions." 
            });
        }
        next();
    };
};
/* For E.g.,
    allowedRoles = ["admin", "analyst"]
    req.user.role = "viewer"
    Since "viewer" is not in the list -> access denied.
*/