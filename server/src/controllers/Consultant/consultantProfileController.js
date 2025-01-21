import ConsultantProfile from "../../models/Consultant/User.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import{notificationService} from "../../service/sendPushNotification.js";

export const getConsultantProfile = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "User not authenticated. Please log in." });
    }

    const userId = req.user._id;

    // Fetch consultant profile
    const profile = await ConsultantProfile.findById(userId).select(
      "-password"
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
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Retrieve the user profile based on the provided userId
    const user = await ConsultantProfile.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found. Please check your credentials and try again."
      });
    }

    // Verify the current password matches the stored password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "The current password you entered is incorrect. Please try again."
      });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Send a notification to the consultant confirming the password change
    try {
      await notificationService.sendToConsultant(
        userId,
        "Password Change Confirmation",
        "Your password has been updated successfully. If you did not make this change, please contact support immediately.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending password change notification:", pushError);
    }

    res
      .status(200)
      .json({ message: "Your password has been changed successfully." });
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
      message: "Your profile picture has been updated successfully."
    });
  } catch (error) {
    next(error);
  }
};
