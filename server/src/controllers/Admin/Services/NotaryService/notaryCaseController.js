import notaryServiceDetailsModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import mongoose from "mongoose";

export const editNotaryCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    // Validate caseId (Check if it's a valid MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID" });
    }

    // Ensure status is provided
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Allowed status values
    const allowedStatuses = [
      "submitted",
      "pending",
      "working",
      "cancelled",
      "completed",
      "rejected",
      "transfer"
    ];

    // Validate the status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find and update the Notary case in a single query
    const updatedCase = await notaryServiceDetailsModel.findOneAndUpdate(
      { _id: caseId }, 
      { $set: { status } },  
      { new: true, runValidators: true } 
    );

    // If the case is not found, return a 404 response
    if (!updatedCase) {
      return res.status(404).json({ message: "Notary case not found" });
    }

    return res.status(200).json({ 
      message: "Status updated successfully", 
      updatedCase: {
        _id: updatedCase._id,
        customerId: updatedCase.customerId,
        status: updatedCase.status
      }
    });
    

  } catch (error) {
    next(error);
  }
};
