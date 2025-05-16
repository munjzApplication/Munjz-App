import IDProof from "../../../models/Consultant/ProfileModel/idProof.js";
import Consultant from "../../../models/Consultant/ProfileModel/User.js";
import mongoose from "mongoose";
import { notificationService } from "../../../service/sendPushNotification.js";
import { io } from "../../../socket/socketController.js";

export const handleDocumentStatus = async (req, res, next) => {
  const { documentType, action } = req.body;
  const { consultantId } = req.params;

  try {
   
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({
        error: "Invalid consultant ID format."
      });
    }

    const [consultant, idProof] = await Promise.all([
      Consultant.findById(consultantId),
      IDProof.findOne({ consultantId })
    ]);

    if (!consultant || !idProof) {
      return res.status(404).json({
        error: "Consultant or ID Proof not found."
      });
    }

    // Validate action type and documentType
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error:
          "Invalid action. The action must be either 'approve' or 'reject'."
      });
    }

    if (!idProof.documentStatus.hasOwnProperty(documentType)) {
      return res.status(400).json({
        error: `Invalid document type: '${documentType}'.`
      });
    }

    // Update document status
    const newStatus = action === "approve" ? "approved" : "rejected";
    idProof.documentStatus[documentType] = newStatus;

    // Cache document status values for performance
    const documentStatuses = Object.values(idProof.documentStatus);

    // Update the overall IDProof status
    let status = "pending";
    if (documentStatuses.every(status => status === "approved")) {
      status = "approved";
      await Consultant.findByIdAndUpdate(consultantId, { status: "active" });
    } else if (documentStatuses.every(status => status === "rejected")) {
      status = "rejected";
      await Consultant.findByIdAndUpdate(consultantId, { status: "inactive" });
    } else {
      await Consultant.findByIdAndUpdate(consultantId, { status: "pending" });
    }

    idProof.status = status;
    await idProof.save();

    // Prepare response message
    const responseMessage =
      action === "approve"
        ? `The document '${documentType}' has been approved successfully.`
        : `The document '${documentType}' has been rejected. Please re-upload the document.`;

    // Send notifications
    await notificationService.sendToConsultant(
      consultantId,
      "Document Verification Update",
      responseMessage
    );

    // Emit Socket Event for Real-Time Update
    io
      .of("/consultant")
      .to(consultantId.toString())
      .emit("consultant-doc-status-update", {
        message: responseMessage,
        status: idProof.status,
        documentStatus: idProof.documentStatus
      });

    io.of("/admin").emit("consultant-doc-status-update", {
      consultantId,
      message: responseMessage,
      status: idProof.status,
      documentStatus: idProof.documentStatus
    });

    return res.status(200).json({
      message: responseMessage,
      status: idProof.status,
      documentStatus: idProof.documentStatus
    });
  } catch (error) {
    console.error("Error in handleDocumentStatus:", error);
    return next(error);
  }
};
