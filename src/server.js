import express from "express";
const app = express();
import "dotenv/config";
import main from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import redisClient from "./config/redis.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import cors from "cors";
import recordRouter from "./routes/recordRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import userRouter from "./routes/userManagement.js";

// We must apply the cors middleware before any middleware runs
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ------ ROUTES ------
// Apply rateLimiter to only authRoutes
app.use("/user", rateLimiter, authRouter);
app.use("/userMgmt", userRouter);
app.use("/record", recordRouter);
app.use("/analytics", analyticsRouter);

const InitializeConnection = async() => {
    try{
        await Promise.all([redisClient.connect(), main()]);
        console.log("DBs Connected");

        app.listen(process.env.PORT, () => {
            console.log("Listening at port number " + process.env.PORT);
        });
    }
    catch(err){
        console.log("Error: " + err.message);
    }
}

InitializeConnection();