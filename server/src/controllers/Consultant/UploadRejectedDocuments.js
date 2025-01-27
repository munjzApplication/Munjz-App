import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import IDProof from "../../models/Consultant/idProof.js";
import ConsultantProfile from "../../models/Consultant/User.js";

export const UploadRejectedDocuments = async (req, res, next) => {
  try {
    // Retrieve consultantId from the token
    const consultantId = req.user._id;
    console.log("req.files", req.files);
    console.log(consultantId);

    // Extract files from the request
    const {
      frontsideId,
      backsideId,
      educationalCertificates,
      experienceCertificates
    } = req.files;
    
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res
        .status(400)
        .json({ message: "Consultant not found with this ID" });
    }
    // Fetch the IDProof details for the consultant
    const idProofDetails = await IDProof.findOne({ consultantId });
    if (!idProofDetails) {
      return res
        .status(400)
        .json({ message: "IDProof not found for this consultant" });
    }

    // Update only the changed fields
    if (frontsideId) {
      const frontsideIdUrl = await uploadFileToS3(
        frontsideId[0],
        "frontsideId"
      );
      idProofDetails.frontsideId = frontsideIdUrl;
      idProofDetails.documentStatus.frontsideId = "pending"; // Reset status
    }

    if (backsideId) {
      const backsideIdUrl = await uploadFileToS3(backsideId[0], "backsideId");
      idProofDetails.backsideId = backsideIdUrl;
      idProofDetails.documentStatus.backsideId = "pending"; // Reset status
    }

    if (educationalCertificates) {
      const educationalCertificateUrls = await Promise.all(
        educationalCertificates.map(file =>
          uploadFileToS3(file, "educationalCertificates")
        )
      );
      idProofDetails.educationalCertificates = educationalCertificateUrls;
      idProofDetails.documentStatus.educationalCertificates = "pending"; // Reset status
    }

    if (experienceCertificates) {
      const experienceCertificateUrls = await Promise.all(
        experienceCertificates.map(file =>
          uploadFileToS3(file, "experienceCertificates")
        )
      );
      idProofDetails.experienceCertificates = experienceCertificateUrls;
      idProofDetails.documentStatus.experienceCertificates = "pending"; // Reset status
    }

    // Save the updated IDProof details
    await idProofDetails.save();

    res.json({ message: "Your documents have been updated successfully." });
  } catch (error) {
    console.error("Error updating IDProof documents:", error);
    next(error);
  }
};
