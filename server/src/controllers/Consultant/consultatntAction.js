import mongoose from "mongoose";
import consultationDetails from "../../models/Admin/consultantModels/consultationModel.js";
import IDProof from "../../models/Consultant/idProof.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import BankDetails from "../../models/Consultant/bankDetails.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { notificationService } from "../../service/sendPushNotification.js";

export const handleConsultantAction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const consultantId = req.user._id;

    const { personalDetails, idProof, bankDetails } = req.body;

    // Parse JSON strings from req.body to log structured data
    const PersonalDetails = JSON.parse(personalDetails);
    const IdProof = JSON.parse(idProof);
    const BankDetails = JSON.parse(bankDetails);

    console.log("parsed Data:", {
      personalDetails: PersonalDetails,
      idProof: IdProof,
      bankDetails: BankDetails,
    });

    console.log("req.body", req.body);
    console.log("req.files", req.files);

    const {
      country,
      languages,
      areaOfPractices,
      experience,
      biography,
    } = PersonalDetails;

    const { nationalId } = IdProof;
    const { holderName, accountNumber, bankName, iban } = BankDetails;

    const missingFields = [];

    if (!consultantId) missingFields.push("consultantId");
    if (!nationalId) missingFields.push("nationalId");
    if (!req.files?.profilePicture) missingFields.push("profilePicture");
    if (!req.files?.frontsideId) missingFields.push("frontsideId");
    if (!req.files?.backsideId) missingFields.push("backsideId");
    if (!req.files?.educationalCertificates) missingFields.push("educationalCertificates");
    if (!req.files?.experienceCertificates) missingFields.push("experienceCertificates");
    if (!country) missingFields.push("country");
    if (!languages) missingFields.push("languages");
    if (!areaOfPractices) missingFields.push("areaOfPractices");
    if (!experience) missingFields.push("experience");
    if (!biography) missingFields.push("biography");
    if (!holderName) missingFields.push("holderName");
    if (!accountNumber) missingFields.push("accountNumber");
    if (!bankName) missingFields.push("bankName");
    if (!iban) missingFields.push("iban");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Some fields are missing.",
        missingFields,
      });
    }

    const existingPersonalDetails = await consultationDetails.findOne({ consultantId }).session(session);
    if (existingPersonalDetails) {
      return res.status(400).json({ error: "You are already registered as a consultant." });
    }

    const existingIdProof = await IDProof.findOne({ nationalId }).session(session);
    if (existingIdProof) {
      return res.status(400).json({ error: "The provided National ID is already registered." });
    }

    const existingBankDetails = await BankDetails.findOne({ consultantId }).session(session);
    if (existingBankDetails) {
      return res.status(400).json({ error: "Bank details are already registered." });
    }

    const profilePictureUrl = await uploadFileToS3(req.files.profilePicture[0], "ConsultantprofileImages");
    const frontsideIdUrl = await uploadFileToS3(req.files.frontsideId[0], "frontsideId");
    const backsideIdUrl = await uploadFileToS3(req.files.backsideId[0], "backsideId");
    const educationalCertificateUrl = await uploadFileToS3(req.files.educationalCertificates[0], "educationalCertificate");
    const experienceCertificateUrl = await uploadFileToS3(req.files.experienceCertificates[0], "experienceCertificate");

    const idProofData = new IDProof({
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
        experienceCertificates: "pending",
      },
    });
    const savedIDProof = await idProofData.save({ session });

    const languagesArray = languages.split(",").map((lang) => lang.trim());
    const areaOfPracticesArray = areaOfPractices.split(",").map((area) => area.trim());

    const personalDetailsData = new PersonalDetails({
      consultantId,
      profilePicture: profilePictureUrl,
      country,
      languages: languagesArray,
      areaOfPractices: areaOfPracticesArray,
      experience,
      biography,
    });
    const savedPersonalDetails = await personalDetailsData.save({ session });

    const bankDetailsData = new BankDetails({
      consultantId,
      holderName,
      accountNumber,
      bankName,
      iban,
    });
    const savedBankDetails = await bankDetailsData.save({ session });

    await session.commitTransaction();
    session.endSession();

    await notificationService.sendToConsultant(
      consultantId,
      "Registration Successful",
      "Your consultant registration has been successfully completed."
    );

    await notificationService.sendToAdmin(
      "New Consultant Registered",
      `A new consultant with ID ${consultantId} has registered.`
    );

    res.status(201).json({
      message: "Consultant data saved successfully.",
      data: {
        idProof: savedIDProof,
        personalDetails: savedPersonalDetails,
        bankDetails: savedBankDetails,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
