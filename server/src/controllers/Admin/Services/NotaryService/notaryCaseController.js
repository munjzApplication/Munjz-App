import notaryServiceDetailsModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import mongoose from "mongoose";

export const editNotaryCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;


    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID" });
    }


    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const allowedStatuses = [
      "submitted",
      "working",
      "completed",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }


    const updatedCase = await notaryServiceDetailsModel.findOneAndUpdate(
      { _id: caseId },
      { $set: { status } },
      { new: true, runValidators: true }
    );


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
