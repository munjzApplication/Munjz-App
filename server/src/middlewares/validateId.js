import mongoose from "mongoose";

// Validate Consultant ID Format
export const validateConsultantId = (req, res, next) => {
    const { consultantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid consultant ID format.",
        });
    }
    next();
};

// Validate Customer ID Format
export const validateCustomerId = (req, res, next) => {
    const { customerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid customer ID format.",
        });
    }
    next();
};
