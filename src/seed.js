import bcrypt from "bcryptjs";
import "dotenv/config";

// Import your models and database connection
import main from "./config/db.js";
import { User } from "./Models/user.js";
import { Record } from "./Models/record.js";

/**
 * ============================================================================
 * @desc Database Seeder Script
 * ============================================================================
 * This script wipes the current database and populates it with a default Admin 
 * user and 50 randomized financial records. This allows evaluators to instantly 
 * test the Analytics API and Pagination without manual data entry.
 * 
 * * @instructions HOW TO RUN THIS SCRIPT:
 * 1. Ensure your local MongoDB server is running.
 * 2. Open your terminal in the root directory of the project.
 * 3. Run using NPM (Recommended):  npm run seed
 *                      OR 
 *    Run directly via Node:        node src/seed.js
 * ============================================================================
 */

const seedDatabase = async () => {
    try{
        // 1. Connect to the database
        await main();
        console.log("🌱 Database connected. Starting seeding process...\n");

        // 2. Wipe existing data to prevent duplicates on multiple runs
        await User.deleteMany({});
        await Record.deleteMany({});
        console.log("🧹 Cleared existing Users and Records.\n");

        // Create the Default Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Admin123!", salt);

        const adminUser = await User.create({
            firstName: "System",
            lastName: "Admin",
            email: "admin@finance.com",
            password: hashedPassword,
            role: "admin",
            isActive: true
        });
        console.log(`👤 Admin user created! (Email: admin@finance.com, Password: Admin123!)\n`);

        // 4. Generate 50 Realistic Financial Records
        const records = [];
        const categories = {
            income: ["Salary", "Freelance", "Investment", "Bonus"],
            expense: ["Food", "Rent", "Software", "Travel", "Utilities", "Entertainment"]
        };

        for(let i = 0; i < 50; i++){
            // Randomize whether it's an income (30% chance) or expense (70% chance)
            const isExpense = Math.random() > 0.3;
            const type = isExpense ? "expense" : "income";
            
            // Pick a random category based on the type
            const categoryList = categories[type];
            const category = categoryList[Math.floor(Math.random() * categoryList.length)];
            
            // Generate a realistic amount (Expenses: $10-$500 | Income: $1000-$5000)
            const amount = isExpense 
                ? Math.floor(Math.random() * 490) + 10 
                : Math.floor(Math.random() * 4000) + 1000;

            // Generate a random date within the last 30 days so the dashboard looks active
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

            records.push({
                amount,
                type,
                category,
                date: randomDate,
                notes: `Auto-generated ${category} record for testing`,
                createdBy: adminUser._id, // Attach to our new Admin
                isDeleted: false
            });
        }

        // 5. Bulk Insert into MongoDB
        await Record.insertMany(records);
        console.log(`📈 Successfully generated ${records.length} financial records.\n`);
        
        console.log("✅ Seeding Complete! You can now start the server.\n");
        process.exit(0); // Exit the script successfully
        
    } 
    catch(error){
        console.error("❌ Seeding Failed:", error);
        process.exit(1); // Exit with failure code
    }
};

// Execute the function
seedDatabase();