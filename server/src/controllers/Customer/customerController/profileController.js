import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";

import courtServiceDetailsModel from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import notaryServiceDetailsModel from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
// Get Profile
export const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await CustomerProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log("pppop", updates);

    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // Push Notification
    try {
      await notificationService.sendToCustomer(
        id,
        "Profile Updated",
        "Your profile has been updated successfully.",
        { updatedFields: updates }
      );
    } catch (pushError) {
      console.error("Error sending profile update notification:", pushError);
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile Picture
export const updateProfilePicture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const imageUrl = await uploadFileToS3(file, "profile-pictures");

    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      id,
      { imageUrl },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // Push Notification
    try {
      await notificationService.sendToCustomer(
        id,
        "Profile Picture Updated",
        "Your profile picture has been updated successfully.",
        { imageUrl }
      );
    } catch (pushError) {
      console.error(
        "Error sending profile picture update notification:",
        pushError
      );
    }

    res.status(200).json({
      message: "Profile picture updated successfully.",
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

// Delete Profile
export const deleteProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedProfile = await CustomerProfile.findByIdAndDelete(id);
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
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await CustomerProfile.findById(id);
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
        id,
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
  const { id } = req.params;

  try {
    const courtService = await notaryServiceDetailsModel.findById(id);

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
