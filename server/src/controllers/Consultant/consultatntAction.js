import mongoose from "mongoose";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import IDProof from "../../models/Consultant/ProfileModel/idProof.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import BankDetails from "../../models/Consultant/ProfileModel/bankDetails.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { notificationService } from "../../service/sendPushNotification.js";

export const handleConsultantAction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const consultantId = req.user._id;

    // Parse stringified JSON fields in req.body
    const personalDetails = JSON.parse(req.body.personalDetails);
    const idProof = JSON.parse(req.body.idProof);
    const bankDetails = JSON.parse(req.body.bankDetails);

    const { country, languages, areaOfPractices, experience, biography } =
      personalDetails;

    const { nationalId } = idProof;
    const { holderName, accountNumber, bankName, iban } = bankDetails;

    console.log("Parsed Data:", { personalDetails, idProof, bankDetails });

    console.log("req.body", req.body);
    console.log("req.files", req.files);

    // Ensure all required fields are present
    const missingFields = [];

    if (!consultantId) missingFields.push("consultantId");
    if (!nationalId) missingFields.push("nationalId");
    if (!req.files?.profilePicture) missingFields.push("profilePicture");
    if (!req.files?.frontsideId) missingFields.push("frontsideId");
    if (!req.files?.backsideId) missingFields.push("backsideId");
    if (!req.files?.educationalCertificates)
      missingFields.push("educationalCertificates");
    if (!req.files?.experienceCertificates)
      missingFields.push("experienceCertificates");
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
        missingFields
      });
    }
    // Check if ConsultantProfile already exists (to avoid redundant creation)
    const existingProfile = await ConsultantProfile.findOne({
      _id: consultantId
    }).session(session);

    if (!existingProfile) {
      return res
        .status(404)
        .json({ error: "Consultant profile does not exist." });
    }
    // Check if consultant already exists in any of the necessary models
    const existingPersonalDetails = await PersonalDetails.findOne({
      consultantId
    }).session(session);
    if (existingPersonalDetails) {
      return res
        .status(400)
        .json({ error: "You are already registered as a consultant." });
    }

    const existingIdProof = await IDProof.findOne({ nationalId }).session(
      session
    );
    if (existingIdProof) {
      return res
        .status(400)
        .json({ error: "The provided National ID is already registered." });
    }

    const existingBankDetails = await BankDetails.findOne({
      consultantId
    }).session(session);
    if (existingBankDetails) {
      return res
        .status(400)
        .json({ error: "Bank details are already registered." });
    }

    // Upload files to S3
    const profilePictureUrl = await uploadFileToS3(
      req.files.profilePicture[0],
      "ConsultantprofileImages"
    );
    const frontsideIdUrl = await uploadFileToS3(
      req.files.frontsideId[0],
      "frontsideId"
    );
    const backsideIdUrl = await uploadFileToS3(
      req.files.backsideId[0],
      "backsideId"
    );
    const educationalCertificateUrl = await uploadFileToS3(
      req.files.educationalCertificates[0],
      "educationalCertificate"
    );
    const experienceCertificateUrl = await uploadFileToS3(
      req.files.experienceCertificates[0],
      "experienceCertificate"
    );

    // Save IDProof data
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
        experienceCertificates: "pending"
      }
    });
    const savedIDProof = await idProofData.save({ session });

    // Save PersonalDetails data
    const languagesArray = languages.split(",").map((lang) => lang.trim());
    const areaOfPracticesArray = areaOfPractices
      .split(",")
      .map((area) => area.trim());

    const personalDetailsData = new PersonalDetails({
      consultantId,
      profilePicture: profilePictureUrl,
      country: country,
      languages: languagesArray,
      areaOfPractices: areaOfPracticesArray,
      experience: experience,
      biography: biography
    });
    const savedPersonalDetails = await personalDetailsData.save({ session });

    // Save BankDetails data
    const bankDetailsData = new BankDetails({
      consultantId,
      holderName,
      accountNumber,
      bankName,
      iban
    });
    const savedBankDetails = await bankDetailsData.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify the consultant
    await notificationService.sendToCustomer(
      consultantId,
      "Welcome to Munjz-App!",
      "Your registration is successful. Explore our services and get started today!"
    );

    await notificationService.sendToAdmin(
      "New Consultant Registration",
      `A new Consultant has registered: ${existingProfile.Name} (${existingProfile.email}).`
    );

    res.status(201).json({
      message: "Consultant Registered successfully.",
      user:{
        id :consultantId
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
