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
    console.log("req.body",req.body);
    console.log("req.files",req.files);
    console.log("personalDetails:", JSON.parse(req.body.personalDetails));
console.log("idProof:", JSON.parse(req.body.idProof));
console.log("bankDetails:", JSON.parse(req.body.bankDetails));

    // Ensure all required fields are present
    const missingFields = [];

    if (!consultantId) missingFields.push("consultantId");
    if (!idProof?.nationalId) missingFields.push("idProof.nationalId");
    if (!req.files?.profilePicture) missingFields.push("profilePicture");
    if (!req.files?.frontsideId) missingFields.push("frontsideId");
    if (!req.files?.backsideId) missingFields.push("backsideId");
    if (!req.files?.educationalCertificates) missingFields.push("educationalCertificates");
    if (!req.files?.experienceCertificates) missingFields.push("experienceCertificates");
    if (!personalDetails?.country) missingFields.push("personalDetails.country");
    if (!personalDetails?.languages) missingFields.push("personalDetails.languages");
    if (!personalDetails?.areaOfPractices) missingFields.push("personalDetails.areaOfPractices");
    if (!personalDetails?.experience) missingFields.push("personalDetails.experience");
    if (!personalDetails?.biography) missingFields.push("personalDetails.biography");
    if (!bankDetails?.holderName) missingFields.push("bankDetails.holderName");
    if (!bankDetails?.accountNumber) missingFields.push("bankDetails.accountNumber");
    if (!bankDetails?.bankName) missingFields.push("bankDetails.bankName");
    if (!bankDetails?.iban) missingFields.push("bankDetails.iban");
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Some fields are missing.", 
        missingFields 
      });
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

   
    const bankDetailsData = new BankDetails({
      consultantId,
      holderName: bankDetails.holderName,
      accountNumber: bankDetails.accountNumber,
      bankName: bankDetails.bankName,
      iban: bankDetails.iban
    });
    const savedBankDetails = await bankDetailsData.save({ session });

   
    await session.commitTransaction();
    session.endSession();

    
    res.status(201).json({
      message: "Consultant data saved successfully.",
      data: {
        idProof: savedIDProof,
        personalDetails: savedPersonalDetails,
        bankDetails: savedBankDetails
      }
    });
  } catch (error) {
  
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
