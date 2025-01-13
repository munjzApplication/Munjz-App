import mongoose from "mongoose";
import IDProof from "../../models/Consultant/idProof.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import BankDetails from "../../models/Consultant/bankDetails.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";

export const handleConsultantAction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const consultantId = req.user._id;

    // Extract body data
    const {
      idProof,
      personalDetails,
      bankDetails
    } = req.body;

    // Ensure all required fields are present
    if (
      !consultantId ||
      !idProof?.nationalId ||
      !req.files?.profilePicture ||
      !req.files?.frontsideId ||
      !req.files?.backsideId ||
      !req.files?.educationalCertificates ||
      !req.files?.experienceCertificates ||
      !personalDetails?.country ||
      !personalDetails?.languages ||
      !personalDetails?.areaOfPractices ||
      !personalDetails?.experience ||
      !personalDetails?.biography ||
      !bankDetails?.holderName ||
      !bankDetails?.accountNumber ||
      !bankDetails?.bankName ||
      !bankDetails?.iban
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check for existing National ID
    const existingIdProof = await IDProof.findOne({ nationalId: idProof.nationalId }).session(session);
    if (existingIdProof) {
      return res.status(400).json({ error: "National ID already exists." });
    }

    // Upload files to S3
    const profilePictureUrl = await uploadFileToS3(req.files.profilePicture[0], "profileImages");
    const frontsideIdUrl = await uploadFileToS3(req.files.frontsideId[0], "frontsideId");
    const backsideIdUrl = await uploadFileToS3(req.files.backsideId[0], "backsideId");
    const educationalCertificateUrl = await uploadFileToS3(req.files.educationalCertificates[0], "educationalCertificate");
    const experienceCertificateUrl = await uploadFileToS3(req.files.experienceCertificates[0], "experienceCertificate");

    // Save IDProof data
    const idProofData = new IDProof({
      consultantId,
      nationalId: idProof.nationalId,
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
    const savedIDProof = await idProofData.save({ session });

    // Save PersonalDetails data
    const languagesArray = personalDetails.languages.split(",").map((lang) => lang.trim());
    const areaOfPracticesArray = personalDetails.areaOfPractices.split(",").map((area) => area.trim());

    const personalDetailsData = new PersonalDetails({
      consultantId,
      profilePicture: profilePictureUrl,
      country: personalDetails.country,
      languages: languagesArray,
      areaOfPractices: areaOfPracticesArray,
      experience: personalDetails.experience,
      biography: personalDetails.biography
    });
    const savedPersonalDetails = await personalDetailsData.save({ session });

    // Save BankDetails data
    const bankDetailsData = new BankDetails({
      consultantId,
      holderName: bankDetails.holderName,
      accountNumber: bankDetails.accountNumber,
      bankName: bankDetails.bankName,
      iban: bankDetails.iban
    });
    const savedBankDetails = await bankDetailsData.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send response with saved data in the requested format
    res.status(201).json({
      message: "Consultant data saved successfully.",
      data: {
        idProof: savedIDProof,
        personalDetails: savedPersonalDetails,
        bankDetails: savedBankDetails
      }
    });
  } catch (error) {
    // Abort the transaction in case of any error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
