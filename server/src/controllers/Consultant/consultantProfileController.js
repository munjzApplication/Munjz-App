import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import IDProof from "../../models/Consultant/ProfileModel/idProof.js";
import BankDetails from "../../models/Consultant/ProfileModel/bankDetails.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { notificationService } from "../../service/sendPushNotification.js";
import mongoose from "mongoose";

export const getConsultantProfile = async (req, res) => {
  try {
    // 1. Ensure user is authenticated
    const userId = req?.user?._id;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated. Please log in.",
      });
    }

    // 2. Fetch consultant profile (excluding sensitive fields)
    const consultantProfile = await ConsultantProfile.findById(userId)
      .select("-password -resetOtpHash -resetOtpExpiry")
      .lean();

    if (!consultantProfile) {
      return res.status(404).json({
        message: "Consultant profile not found.",
      });
    }

    // 3. Fetch personal details (include profilePicture, country, and countryCode)
    const personalDetails = await PersonalDetails.findOne({ consultantId: userId })
      .select("profilePicture country countryCode")
      .lean();

    if (!personalDetails) {
      return res.status(404).json({
        message: "Personal details not found.",
      });
    }

    // 4. Combine profile and personal details
    const combinedProfile = {
      ...consultantProfile,
      profilePicture: personalDetails.profilePicture,
      country: personalDetails.country,
      countryCode: personalDetails.countryCode,
    };

    // 5. Send response
    return res.status(200).json({
      message: "Profile fetched successfully",
      profile: combinedProfile,
    });

  } catch (error) {
    console.error("Error fetching consultant profile:", error);
    return res.status(500).json({
      message: "An error occurred while fetching the profile.",
    });
  }
};

export const addPhoneNumber = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { phoneNumber ,countryCode } = req.body;
    console.log("req.body", req.body);
    

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const profile = await ConsultantProfile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    profile.phoneNumber = phoneNumber;
    profile.countryCode = countryCode || profile.countryCode; // Use existing countryCode if not provided
    await profile.save();

    console.log("Phone number added successfully:", profile);
    

    res.status(200).json({ 
      message: "Phone number added successfully.",
      phoneNumber,
      countryCode
     });
  } catch (error) {
    next(error);
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const consultantId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both Current and new passwords are required." });
    }

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    if (!consultant.password) {
      return res
        .status(400)
        .json({ message: "Password not set. Please contact support." });
    }

    const isMatch = await bcrypt.compare(currentPassword, consultant.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    consultant.password = hashedPassword;
    await consultant.save();

    // Push Notification
    try {
      // Notify customer
      await notificationService.sendToConsultant(
        consultantId,
        "Security Alert: Password Changed",
        "Your password has been updated successfully. If you did not make this change, please contact support immediately."
      );

      // Notify admin
      await notificationService.sendToAdmin(
        "Consultant Password Changed",
        `Consultant ${consultant.Name} (${consultant.email}) has changed their password.`
      );
    } catch (pushError) {
      console.error("Error sending password change notification:", pushError);
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
    const userId = req.user._id;

    // Find the user first
    const user = await ConsultantProfile.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Profile not found." });
    }
    await IDProof.findOneAndDelete({ consultantId: userId }).session(session);
    await BankDetails.findOneAndDelete({ consultantId: userId }).session(
      session
    );
    // Prepare update fields (conditionally remove social logins)
    const updateFields = {
      Name: "Deleted_User",
      profilePhoto: null,
      email: null,
      phoneNumber: null,
      password: null,
      deletedAt: new Date()
    };

    if (user.googleId) updateFields.googleId = null;
    if (user.facebookId) updateFields.facebookId = null;
    if (user.appleId) updateFields.appleId = null;

    // Update user with the soft delete fields
    const updatedProfile = await ConsultantProfile.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();


    // Push Notifications
    try {
      // Notify Consultant
      await notificationService.sendToConsultant(
        userId,
        "Account Deleted",
        "Your account has been successfully deleted. If this was not you, please contact support immediately."
      );

      // Notify admin
      await notificationService.sendToAdmin(
        "Consultant Profile Deleted",
        `Consultant ${user.Name} (${user.email}) has deleted their account.`
      );
    } catch (pushError) {
      console.error("Error sending account deletion notification:", pushError);
    }
    res.status(200).json({ message: "Profile deleted successfully." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
