import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import IDProof from "../../models/Consultant/ProfileModel/idProof.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import { notificationService } from "../../service/sendPushNotification.js";

export const UploadRejectedDocuments = async (req, res, next) => {
  try {
    // Retrieve consultantId from the token
    const consultantId = req.user._id;
   

    // Check if files are provided in the request
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    // Extract files from the request
    const { frontsideId, backsideId, educationalCertificates, experienceCertificates } = req.files;

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(400).json({ message: "Consultant not found with this ID" });
    }

    // Fetch the IDProof details for the consultant
    const idProofDetails = await IDProof.findOne({ consultantId });
    if (!idProofDetails) {
      return res.status(400).json({ message: "IDProof not found for this consultant" });
    }

    // Update only the changed fields
    if (frontsideId) {
      const frontsideIdUrl = await uploadFileToS3(frontsideId[0], "frontsideId");
      idProofDetails.frontsideId = frontsideIdUrl;
      idProofDetails.documentStatus.frontsideId = "pending"; // Reset status
    }

    if (backsideId) {
      const backsideIdUrl = await uploadFileToS3(backsideId[0], "backsideId");
      idProofDetails.backsideId = backsideIdUrl;
      idProofDetails.documentStatus.backsideId = "pending"; // Reset status
    }

    if (educationalCertificates) {
      // Handle single file upload and store as a string
      const educationalCertificateUrl = await uploadFileToS3(
        educationalCertificates[0],
        "educationalCertificates"
      );
      idProofDetails.educationalCertificates = educationalCertificateUrl;
      idProofDetails.documentStatus.educationalCertificates = "pending"; // Reset status
    }

    if (experienceCertificates) {
      // Handle single file upload and store as a string
      const experienceCertificateUrl = await uploadFileToS3(
        experienceCertificates[0],
        "experienceCertificates"
      );
      idProofDetails.experienceCertificates = experienceCertificateUrl;
      idProofDetails.documentStatus.experienceCertificates = "pending"; // Reset status
    }

    // Save the updated IDProof details
    await idProofDetails.save();

    // Notify Admin
    await notificationService.sendToAdmin(
      "Rejected Documents Re-uploaded",
      `${consultant.Name} has re-uploaded the rejected ID Proof documents. Please review them.`
    );

    res.json({ message: "Your documents have been updated successfully." });
  } catch (error) {
    console.error("Error updating IDProof documents:", error);
    next(error);
  }
};
