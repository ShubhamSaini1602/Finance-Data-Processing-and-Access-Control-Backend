import { Record } from "../Models/record.js";

/**
 * Calculates total income, total expenses, net balance and expenses grouped by category from active records.
 * Uses MongoDB Aggregation Pipeline for maximum performance.
 * * @returns {Promise<Object>} The aggregated financial summary.
 */

// aggregate() in MongoDB is used when you want the database to process, combine, calculate, group, or transform data before sending it back.
// Here, instead of fetching all records into Node.js and then manually calculating totals, we let MongoDB do the work directly in the database, which is much faster.

export const getDashboardSummary = async (userId) => {
    // Runs both pipelines in parallel!
    // totalsArray = result of first pipeline
    // expensesByCategory = result of second pipeline
    // recentRecords = result of the third query
    const [totalsArray, expensesByCategory, recentRecords] = await Promise.all([

        // ================================
        // ====== Pipeline 1: Totals ======
        // ================================
        Record.aggregate([
            /* --> Calls MongoDB’s aggregation pipeline.
                Think of the pipeline as a sequence of steps:
                    1) Filter records
                    2) Group them
                    3) Calculate totals
                The below array [] contains those steps.
            */

            // Add createdBy: userId to only fetch THIS user's records
            { $match: { createdBy: userId, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                    totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                }
            }
        ]),
        // After pipeline 1, the result becomes:
        /* totalsArray = [
                {
                    totalIncome: 1500,
                    totalExpense: 500
                }
            ] */

        // ========================================================
        // ====== Pipeline 2: Expenses grouped by Categories ======
        // ========================================================
        Record.aggregate([
            { $match: { createdBy: userId, isDeleted: { $ne: true }, type: "expense" } },
            // This groups all records having the same category together, and then adds up their amount values to calculate the total money spent in each category
            { $group: { _id: "$category", totalSpent: { $sum: "$amount" } } },
            { $sort: { totalSpent: -1 } }  // Sort Highest Expense First
        ]),
        // After pipeline 2:
        /* expensesByCategory = [
                { _id: "Travel", totalSpent: 300 },
                { _id: "Food", totalSpent: 200 }
            ] */

        // =============================
        // ====== Recent Activity ======
        // =============================
        Record.find({ createdBy: userId, isDeleted: { $ne: true } })
            .sort({ date: -1 }) // Sort by date descending (newest first)
            .limit(5)           // Only grab the top 5 most recent
            .select("amount type category date notes") // Only select the fields the frontend needs (keeps the payload small!)
    ]);

    // Safely extract totals (Handles the Edge Case where the DB is completely empty for a new user)
    const totals = totalsArray[0] || { totalIncome: 0, totalExpense: 0 };
    
    return {
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        netBalance: totals.totalIncome - totals.totalExpense,
        expenseBreakdown: expensesByCategory.map(item => ({
            category: item._id,
            amount: item.totalSpent
        })),
        recentActivity: recentRecords
    };
};