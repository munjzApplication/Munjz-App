import IDProof from "../../../models/Consultant/ProfileModel/idProof.js";
import Consultant from "../../../models/Consultant/ProfileModel/User.js";
import mongoose from "mongoose";
import { notificationService } from "../../../service/sendPushNotification.js";

export const handleDocumentStatus = async (req, res, next) => {
  const { documentType, action } = req.body;
  const { consultantId } = req.params;

  try {
    // Validate consultantId format
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({
        error: "Invalid consultant ID format."
      });
    }

    // Check if consultant exists
    const consultant = await Consultant.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({
        error: "The provided consultant is invalid. Please check and try again."
      });
    }

    // Fetch IDProof document
    const idProof = await IDProof.findOne({ consultantId });
    if (!idProof) {
      return res.status(404).json({
        error:
          "No ID Proof found for the specified consultant. Please verify the consultant ID."
      });
    }

    // Validate action type
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error:
          "Invalid action. The action must be either 'approve' or 'reject'."
      });
    }

    // Validate documentType
    if (!idProof.documentStatus.hasOwnProperty(documentType)) {
      return res.status(400).json({
        error: `Invalid document type: '${documentType}'.`
      });
    }

    // Update document status
    const newStatus = action === "approve" ? "approved" : "rejected";
    idProof.documentStatus[documentType] = newStatus;

    // Check overall status of IDProof
    const allDocumentsApproved = Object.values(idProof.documentStatus).every(
      status => status === "approved"
    );
    const allDocumentsRejected = Object.values(idProof.documentStatus).every(
      status => status === "rejected"
    );

    if (allDocumentsApproved) {
      idProof.status = "approved";
      await Consultant.findByIdAndUpdate(consultantId, { status: "active" });
    } else {
      idProof.status = "pending";
      await Consultant.findByIdAndUpdate(consultantId, { status: "pending" });
    }

    // Save changes
    await idProof.save();

    // Prepare response message
    const responseMessage =
      action === "approve"
        ? `The document '${documentType}' has been approved successfully.`
        : `The document '${documentType}' has been rejected. Please re-upload the document.`;

    await notificationService.sendToConsultant(
      consultantId,
      "Document Verification Update",
      responseMessage
    );


    return res.status(200).json({
      message: responseMessage,
      status: newStatus,
      documentStatus: idProof.documentStatus
    });
  } catch (error) {
    console.error("Error in handleDocumentStatus:", error);
    return next(error);
  }
};
