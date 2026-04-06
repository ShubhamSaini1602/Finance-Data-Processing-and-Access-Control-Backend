import express from "express";
const authRouter = express.Router();
import validateUser from "../utils/validateUser.js";
import { User } from "../Models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/authWare.js";
import redisClient from "../config/redis.js";

const isProduction = process.env.NODE_ENV === "production";

// Registration Logic
authRouter.post("/register", async(req, res) => {
    try{
        const { firstName, lastName, email, password } = req.body;

        // Catch the validation error specifically to return a 400 status
        try {
            validateUser({firstName, email, password});
        } 
        catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists with this email." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
            // role defaults to "viewer" as per our schema
        });

        // JWT Token Logic
        const payload = {
            _id: user._id,
            email: req.body.email,
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1d'});
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });

        const reply = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            _id: user._id,
            role: user.role
        }

        res.status(201).json({
            success: true,
            user: reply,
            message: "User Registered Successfully"
        });
    }
    catch(error){
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Login Logic
authRouter.post("/login", async(req,res) => {
    try{
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password." });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account suspended. Please contact support." });
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // JWT Token Logic
        const payload = {
            _id: user._id,
            email: req.body.email,
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1d'});
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });

        const reply = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            _id: user._id,
            role: user.role
        }

        res.status(200).json({
            success: true,
            user: reply,
            message: "Login Successfully"
        });
    }
    catch(error){
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Logout Logic with Redis Token BlackListing
authRouter.post("/logout",authenticate, async(req,res) => {
    try{
        const { token } = req.cookies;
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`, "Blocked");
        await redisClient.expireAt(`token:${token}`, payload.exp);

        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        
        res.status(200).json({
            success: true,
            message: "Logged out Successfully"
        });
    }
    catch(err){
        res.status(401).send("Error: " + err.message);
    }
});

export default authRouter;

/* ==========================================================================
 * SECURITY TEST: REDIS TOKEN BLACKLISTING (The "Ghost Hacker" Scenario)
 * ==========================================================================
 * How to verify above LOGOUT endpoint in Postman:
 * * 1. THE SETUP:
 *      - Send a POST request to `/user/login` with valid credentials.
 *      - Go to the "Cookies" tab in Postman's response window.
 *      - Manually COPY the value of the `token` cookie to your clipboard.
 * * 2. THE LOGOUT:
 *      - Send a POST request to `/user/logout`. 
 *      - You should receive a "Logged Out Successfully" message.
 *      - Behind the scenes, Redis just memorized that specific token.
 * * 3. THE HACKER ATTEMPT:
 *      - Try to access a protected route (or hit `/logout` again).
 *      - Postman cleared your cookie, so manually paste the token you copied 
 *        earlier back into the request (either in the Cookies tab or Authorization header).
 *      - Hit Send.
 * * 4. THE RESULT:
 *      - The JWT signature is technically still valid, BUT the Redis bouncer 
 *        will catch it. 
 *      - You should be instantly denied with: "Session expired. Please log in again."
 * ==========================================================================
 */