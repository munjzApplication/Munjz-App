import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";
import courtServiceDetailsModel from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import notaryServiceDetailsModel from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";

export const profileSetup = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { country } = req.body;
    const file = req.file;

    // Validate required fields
    if (!country) {
      return res.status(400).json({ message: "Country is required." });
    }

    let profilePhoto;

    if (file) {
      // If a file is uploaded, upload it to S3
      profilePhoto = await uploadFileToS3(file, "profile-pictures");
    } else {
      // Use a dummy profile picture if no file is uploaded
      profilePhoto =
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fprofile-image&psig=AOvVaw0976QLRIgmgsTEgmK5V0A8&ust=1737094267990000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCOitzM3K-YoDFQAAAAAdAAAAABA_"; // Replace with your dummy image URL
    }

    // Fetch the user profile
    const userProfile = await CustomerProfile.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Update the profile with the provided details
    userProfile.profilePhoto = profilePhoto;
    userProfile.country = country;

    await userProfile.save();

    // Send notification (handle errors internally)
    try {
      await notificationService.sendToCustomer(
        userId,
        "Welcome!",
        "Your registration and profile setup are fully completed. You can now start exploring the platform."
      );
    } catch (pushError) {
      console.error("Error sending profile setup notification:", pushError);
    }

    // Respond with success
    res.status(200).json({
      message: "Welcome to Munjz Application",
      details:
        "Your account registrations are fully completed. You can now start exploring the platform."
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch the profile while excluding the password field
    const profile = await CustomerProfile.findById(userId, { password: 0 });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // Avoid sending any sensitive data
    const filteredProfile = {
      ...profile.toObject(),
      password: undefined 
    };

    res.status(200).json({ profile: filteredProfile });
  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    console.log("pppop", updates);

    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );
    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    try {
      await notificationService.sendToCustomer(
        userId,
        "Profile Updated",
        "Your profile has been updated successfully.",
        { updatedFields: updates }
      );
    } catch (pushError) {
      console.error("Error sending profile update notification:", pushError);
    }

    res.status(200).json({
      message: "Profile updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile Picture
export const updateProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded. Please provide a valid image file."
      });
    }

    // Upload the file to the S3 bucket
    const profilePhotoUrl = await uploadFileToS3(file, "CustomerProfile-pic");

    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      userId,
      { profilePhoto: profilePhotoUrl },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Profile update failed. Please try again.",
        profilePhoto: profilePhotoUrl
      });
    }

    try {
      await notificationService.sendToCustomer(
        userId,
        "Profile Picture Updated",
        "Your profile picture has been successfully updated. You can view the changes in your profile.",
        { profilePhoto: profilePhotoUrl }
      );
    } catch (notificationError) {
      console.error(
        "Error sending notification for profile picture update:",
        notificationError
      );
    }

    // Respond with success
    res.status(200).json({
      message: "Your profile picture has been successfully updated."
    });
  } catch (error) {
    next(error);
  }
};

// Delete Profile
export const deleteProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deletedProfile = await CustomerProfile.findByIdAndDelete(userId);
    if (!deletedProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    res.status(200).json({ message: "Profile deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// Change Password
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await CustomerProfile.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Push Notification
    try {
      await notificationService.sendToCustomer(
        userId,
        "Password Changed",
        "Your password has been changed successfully.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending password change notification:", pushError);
    }
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const user = await CustomerProfile.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    try {
      await notificationService.sendToCustomer(
        user._id,
        "Password Reset",
        "Your password has been reset successfully.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending password reset notification:", pushError);
    }
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logoutProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User not found or not authenticated." });
    }

    const user = await CustomerProfile.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isLoggedIn = false;
    await user.save();

    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (req, res) => {
  const userId = req.user._id;

  try {
    const courtService = await notaryServiceDetailsModel.findById(userId);

    if (!courtService) {
      return res.status(404).json({
        success: false,
        message: "Service not found with the provided ID"
      });
    }

    console.log("Service Details:", courtService);

    res.status(200).json({
      success: true,
      service: courtService
    });
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
      error: error.message
    });
  }
};
