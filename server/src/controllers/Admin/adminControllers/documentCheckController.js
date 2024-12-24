import IDProof from "../../../models/Consultant/idProof.js";
import Consultant from "../../../models/Consultant/User.js";
import mongoose from "mongoose";
import { sendNotificationToConsultant } from "../../../helper/consultant/notificationHelper.js";

export const handleDocumentStatus = async (req, res, next) => {
  const { consultantId, documentType, action } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({ error: "Invalid consultant ID format." });
    }
    const idProof = await IDProof.findOne({ consultantId });

    if (!idProof) {
      return res.status(404).json({ error: "Consultant IDProof not found." });
    }

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    idProof.documentStatus[documentType] = newStatus;

    const allDocumentsApproved = Object.values(idProof.documentStatus).every(
      status => status === "approved"
    );
    const allDocumentsRejected = Object.values(idProof.documentStatus).every(
      status => status === "rejected"
    );

    if (allDocumentsApproved) {
      idProof.status = "approved";
      await Consultant.findByIdAndUpdate(consultantId, { status: "active" });
    } else if (allDocumentsRejected) {
      idProof.status = "declined";
      await Consultant.findByIdAndUpdate(consultantId, { status: "declined" });
    } else {
      idProof.status = "pending";
    }

    await idProof.save();
    let notificationMessage;
    let additionalData = {};

    if (action === "approve") {
      notificationMessage = `Your ${documentType} document has been approved successfully.`;
      additionalData = {
        status: "approved",
        documentDetails: idProof.documentStatus
      };
    } else {
      notificationMessage = `Your ${documentType} document has been rejected. Please re-upload the document.`;
      additionalData = {
        status: "rejected",
        reuploadInstruction: `Please re-upload the ${documentType} document.`
      };
    }

    await sendNotificationToConsultant(
      consultantId,
      notificationMessage,
      "Document Verification Status"
    );

    if (action === "reject") {
      return res.status(200).json({
        message: `Document ${documentType} has been rejected successfully. Please re-upload the document.`,
        reuploadInstruction: `Please re-upload the ${documentType} document.`,
        idProof
      });
    }

    return res.status(200).json({
      message: `Document ${documentType} has been approved successfully.`,
      idProof
    });
  } catch (error) {
    next(error);
  }
};
