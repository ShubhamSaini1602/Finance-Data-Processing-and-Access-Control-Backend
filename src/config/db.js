import mongoose from "mongoose";

async function main() {
    try {
        const db = await mongoose.connect(process.env.DB_CONNECTION_STRING);
    } 
    catch (error) {
        console.log("Error connecting to MongoDB:", error);
        throw error; // Throw error so index.js knows to send a 500 response
    }
};

export default main;