import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";
import courtServiceDetailsModel from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import notaryServiceDetailsModel from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
import mongoose from "mongoose";

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
        "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg";
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

export const countrySetup = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { country, countryCode, phoneNumber } = req.body;

    if (!country || !countryCode) {
      return res.status(400).json({
        success: false,
        message: "Country and country code are required.",
      });
    }

    let customerProfile = await CustomerProfile.findOne({ _id: userId });

    if (customerProfile) {
      // Update existing profile
      customerProfile.country = country;
      customerProfile.countryCode = countryCode;

      if (phoneNumber) {
        const isPhoneExists = await CustomerProfile.findOne({
          phoneNumber,
          _id: { $ne: userId }, // Ensure phone number is unique for other users
        });

        if (isPhoneExists) {
          return res.status(400).json({
            success: false,
            message: "Phone number is already in use.",
          });
        }

        customerProfile.phoneNumber = phoneNumber;
      }

      await customerProfile.save();
    } else {
      // Create new profile
      const isPhoneExists = await CustomerProfile.findOne({ phoneNumber });

      if (isPhoneExists) {
        return res.status(400).json({
          message: "Phone number is already in use.",
        });
      }

      customerProfile = await CustomerProfile.create({
        _id: userId,
        country,
        countryCode,
        phoneNumber,
      });
    }

    res.status(200).json({
      message: "Country updated successfully.",

    });
  } catch (error) {
    console.error("Error in country setup:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
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
      message: "Profile updated successfully."
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
      message: "Your profile picture has been successfully updated.",
      profilePhoto: profilePhotoUrl
    });
  } catch (error) {
    next(error);
  }
};

// Delete Profile
export const deleteProfile = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;

    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      userId,
      { $set: { deleted: true } }, // Marking as deleted
      { new: true, session } // Ensures updated document is returned
    );

    if (!updatedProfile) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Profile not found." });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Profile marked as deleted.", profile: updatedProfile });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
