import { z } from "zod";

const createRecordSchema = z.object({
    amount: z.number({ 
        required_error: "Amount is required", 
        invalid_type_error: "Amount must be a number" 
    }).positive("Amount must be greater than zero"),
    
    // .refine() -> Always runs our custom validation logic with our exact message
    type: z.string({
        required_error: "Type is required",
        invalid_type_error: "Type must be a string"
    }).refine(val => ['income', 'expense'].includes(val), {
        message: "Type must be exactly 'income' or 'expense'"
    }),
    
    category: z.string({ 
        required_error: "Category is required" 
    }).min(2, "Category must be at least 2 characters"),
    
    // coerce.date() automatically converts valid date strings (like "2023-10-01") into JS Date objects
    date: z.coerce.date().optional(), 
    
    notes: z.string().optional()
});

const updateRecordSchema = z.object({
    amount: z.number({ 
        invalid_type_error: "Amount must be a number" 
    }).positive("Amount must be greater than zero").optional(),
    
    type: z.string()
        .refine(val => ['income', 'expense'].includes(val), {
            message: "Type must be exactly 'income' or 'expense'"
        })
    .optional(),
    
    category: z.string().min(2, "Category must be at least 2 characters").optional(),
    
    date: z.coerce.date().optional(),
    
    notes: z.string().optional()
});


export const validateCreateRecord = (data) => {
    const result = createRecordSchema.safeParse(data);
    
    if(!result.success){
        const errorMessage = result.error?.issues?.[0]?.message || "Invalid data provided";
        throw new Error(errorMessage);
    }
};

export const validateUpdateRecord = (data) => {
    const result = updateRecordSchema.safeParse(data);
    
    if(!result.success){
        const errorMessage = result.error?.issues?.[0]?.message || "Invalid data provided";
        throw new Error(errorMessage);
    }
};