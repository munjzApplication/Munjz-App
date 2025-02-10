import ConsultantProfile from "../../models/Consultant/User.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import IDProof from "../../models/Consultant/idProof.js";
import BankDetails from "../../models/Consultant/bankDetails.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import{notificationService} from "../../service/sendPushNotification.js";
import mongoose from "mongoose";

export const getConsultantProfile = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "User not authenticated. Please log in." });
    }

    const userId = req.user._id;

    // Fetch consultant profile (exclude password, resetOtpHash, and resetOtpExpiry)
    const profile = await ConsultantProfile.findById(userId).select(
      "-password -resetOtpHash -resetOtpExpiry"
    );
    if (!profile) {
      return res.status(404).json({ message: "Consultant profile not found." });
    }

    // Fetch personal details (profilePic and country)
    const personalDetails = await PersonalDetails.findOne({
      consultantId: userId
    }).select("profilePicture country");

    if (!personalDetails) {
      return res.status(404).json({ message: "Personal details not found." });
    }

    // Combine both results into a single response
    const combinedProfile = {
      ...profile.toObject(), // Convert Mongoose document to plain JavaScript object
      profilePicture: personalDetails.profilePicture,
      country: personalDetails.country
    };

    res.status(200).json({
      message: "Profile fetched successfully",
      profile: combinedProfile
    });
  } catch (error) {
    console.error("Error fetching consultant profile:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the profile." });
  }
};


export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const consultantId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both Current and new passwords are required." });
    }

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    if (!consultant.password) {
      return res.status(400).json({ message: "Password not set. Please contact support." });
    }

    const isMatch = await bcrypt.compare(currentPassword, consultant.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    consultant.password = hashedPassword;
    await consultant.save();

    // Optional: Send notification
    try {
      await notificationService.sendToConsultant(
        consultantId,
        "Password Changed",
        "Your password has been updated successfully."
      );
    } catch (notificationError) {
      console.error("Error sending password change notification:", notificationError);
    }

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req, res, next) => {
  try {
    const consultantId = req.user._id;
    const file = req.file;

    // Check if the file was uploaded
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded. Please upload a valid image file."
      });
    }

    // Upload the profile picture to S3 and retrieve the image URL
    const profilePicture = await uploadFileToS3(
      file,
      "ConsultantprofileImages"
    );

    // Check if the profile exists in the database
    const profile = await PersonalDetails.findOne({
      consultantId: consultantId
    });

    if (!profile) {
      return res.status(404).json({
        message:
          "Profile not found. Please check your information and try again."
      });
    }

    // Update the user's profile with the new profile picture URL
    const updatedProfile = await PersonalDetails.findOneAndUpdate(
      { consultantId: consultantId },
      { profilePicture: profilePicture },
      { new: true }
    );

    // If the profile was not updated, return an error message
    if (!updatedProfile) {
      return res
        .status(404)
        .json({ message: "Failed to update the profile. Please try again." });
    }

    // Send a notification confirming the profile picture update
    try {
      await notificationService.sendToConsultant(
        consultantId,
        "Profile Picture Updated",
        "Your profile picture has been updated successfully. You can view the changes in your profile.",
        { profilePicture: profilePicture }
      );
    } catch (pushError) {
      console.error(
        "Error sending profile picture update notification:",
        pushError
      );
    }

    res.status(200).json({
      message: "Your profile picture has been updated successfully.",
      profilePicture: profilePicture 
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const consultantId = req.user._id;

    // Soft delete Consultant Profile by setting a `deleted` flag
    const deletedProfile = await ConsultantProfile.findByIdAndUpdate(
      consultantId,
      { deleted: true }, // Add a `deleted` flag to mark the profile as deleted
      { new: true, session }
    );

    if (!deletedProfile) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Profile not found." });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Profile marked as deleted successfully." });
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
