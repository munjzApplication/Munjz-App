import mongoose from "mongoose";
import CourtCase from "../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import TranslationCase from "../../models/Customer/translationModel/translationDetails.js";


export const updateTotalAmountPaid = async (caseId, caseType, amount, session = null) => {
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
        throw new Error("Invalid case ID.");
    }
    if (!amount || amount <= 0) {
        throw new Error("Invalid payment amount.");
    }

    let model;
    switch (caseType) {
        case "CourtCase":
            model = CourtCase;
            break;
        case "NotaryCase":
            model = NotaryCase;
            break;
        case "TranslationCase":
            model = TranslationCase;
            break;
        default:
            throw new Error("Invalid case type.");
    }

    try {
        const updateQuery = { $inc: { totalAmountPaid: amount } }; 
        const options = session ? { new: true, session } : { new: true };

        const updatedCase = await model.findByIdAndUpdate(caseId, updateQuery, options);

        if (!updatedCase) {
            throw new Error(`${caseType} not found.`);
        }
console.log("updatedCase", updatedCase);

        return updatedCase;
    } catch (error) {
        console.error(`Error updating totalAmountPaid for ${caseType}:`, error);
        throw new Error("Failed to update totalAmountPaid.");
    }
};
