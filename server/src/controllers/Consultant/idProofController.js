import IDProof from "../../models/Consultant/idProof.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import mongoose from "mongoose";

export const uploadIDProof = async (req, res,next) => {
  const consultantId = req.user._id;
  const { nationalId } = req.body;

  if (!consultantId || !nationalId || !req.files) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!mongoose.Types.ObjectId.isValid(consultantId)) {
    return res.status(400).json({ error: "Invalid consultant ID format." });
  }

  try {
    const {
      frontsideId,
      backsideId,
      educationalCertificates,
      experienceCertificates
    } = req.files;

    if (
      !frontsideId ||
      !backsideId ||
      !educationalCertificates ||
      !experienceCertificates
    ) {
      return res.status(400).json({ error: "All files are required." });
    }

    // Upload files to S3 with the correct folder paths
    const frontsideIdUrl = await uploadFileToS3(frontsideId[0], "frontsideId");
    const backsideIdUrl = await uploadFileToS3(backsideId[0], "backsideId");
    const educationalCertificateUrl = await uploadFileToS3(
      educationalCertificates[0],
      "educationalCertificate"
    );
    const experienceCertificateUrl = await uploadFileToS3(
      experienceCertificates[0],
      "experienceCertificate"
    );

    // Create IDProof document with pending status for each document
    const idProof = new IDProof({
      consultantId,
      nationalId,
      frontsideId: frontsideIdUrl,
      backsideId: backsideIdUrl,
      educationalCertificates: educationalCertificateUrl,
      experienceCertificates: experienceCertificateUrl,
      documentStatus: {
        frontsideId: "pending",
        backsideId: "pending",
        educationalCertificates: "pending",
        experienceCertificates: "pending"
      }
    });

    await idProof.save();

    return res
      .status(201)
      .json({ message: "ID Proof uploaded successfully.", idProof });
  } catch (error) {
    next(error)
  }
};
