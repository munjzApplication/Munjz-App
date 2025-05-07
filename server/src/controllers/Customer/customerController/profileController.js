import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";
import notaryServiceDetailsModel from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
import mongoose from "mongoose";
import { io } from "../../../socket/socketController.js";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../helper/dateFormatter.js";
import wallet from "../../../models/Customer/customerModels/walletModel.js";

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
        userProfile._id,
        "Welcome to MUNJZ",
        "Your registration was successful. Welcome aboard!"
      );

      await notificationService.sendToAdmin(
        "New Customer Registration",
        `A new customer ${userProfile.Name} (${userProfile.email})has registered.`
      );
    } catch (pushError) {
      console.error("Error sending profile setup notification:", pushError);
    }

    const adminNamespace = io.of("/admin");
    adminNamespace.emit("customer-registered", {
      message: "New customer registered",
      profile: {
        _id: userProfile._id,
        Name: userProfile.Name,
        email: userProfile.email,
        phoneNumber: userProfile.phoneNumber,
        customerUniqueId: userProfile.customerUniqueId,
        countryCode: userProfile.countryCode,
        country: userProfile.country,
        isBlocked: userProfile.isBlocked,
        creationDate: formatDate(new Date()),
        profilePhoto: userProfile.profilePhoto,
        walletBalance: "0:00"
      }
    });
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
        message: "Country and country code are required."
      });
    }

    if (phoneNumber) {
      const isPhoneExists = await CustomerProfile.findOne({
        phoneNumber,
        _id: { $ne: userId } 
      });

      if (isPhoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already in use."
        });
      }
    }

    // Update or create customer profile
    const customerProfile = await CustomerProfile.findOneAndUpdate(
      { _id: userId },
      {
        country,
        countryCode,
        phoneNumber: phoneNumber || null 
      },
      { new: true, upsert: true, runValidators: true } 
    );

    // Notify on registration
    await notificationService.sendToCustomer(
      customerProfile._id,
      "Welcome to MUNJZ",
      "Your registration was successful. Welcome aboard!"
    );
    await notificationService.sendToAdmin(
      "New Customer Registration",
      `A new customer ${customerProfile.Name} (${customerProfile.email}) has registered `
    );

    // Emit event to admin namespace
    const adminNamespace = io.of("/admin");
    adminNamespace.emit("customer-registered", {
      message: "New customer registered",
      profile: {
        _id: customerProfile._id,
        Name: customerProfile.Name,
        email: customerProfile.email,
        phoneNumber: customerProfile.phoneNumber,
        customerUniqueId: customerProfile.customerUniqueId,
        countryCode: customerProfile.countryCode,
        country: customerProfile.country,
        isBlocked: customerProfile.isBlocked,
        creationDate: formatDate(new Date()),
        profilePhoto: customerProfile.profilePhoto,
        walletBalance: "0:00"
      }
    });
    res.status(200).json({
      message: "Country updated successfully."
    });
  } catch (error) {
    console.error("Error in country setup:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
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
        "Your profile has been updated successfully."
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
        "Your profile picture has been successfully updated. You can view the changes in your profile."
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
      // Notify customer
      await notificationService.sendToCustomer(
        userId,
        "Security Alert: Password Changed",
        "Your password has been updated successfully. If you did not make this change, please contact support immediately."
      );

      // Notify admin
      await notificationService.sendToAdmin(
        "Customer Password Changed",
        `Customer ${user.Name} (${user.email}) has changed their password.`
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

// Delete Profile
export const deleteProfile = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;

    const user = await CustomerProfile.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Profile not found." });
    }

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
    const updatedProfile = await CustomerProfile.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // Push Notifications
    try {
      // Notify customer
      await notificationService.sendToCustomer(
        userId,
        "Account Deleted",
        "Your account has been successfully deleted. If this was not you, please contact support immediately."
      );

      // Notify admin
      await notificationService.sendToAdmin(
        "Customer Profile Deleted",
        `Customer ${user.Name} (${user.email}) has deleted their account.`
      );
    } catch (pushError) {
      console.error("Error sending account deletion notification:", pushError);
    }
    const walletBalance = await wallet.findOne({ userId: userId });
    // Emit event to admin namespace
    adminNamespace.emit("customer-deleted", {
      profile: {
        _id: updatedProfile._id,
        Name: updatedProfile.Name,
        email: updatedProfile.email,
        phoneNumber: updatedProfile.phoneNumber,
        customerUniqueId: updatedProfile.customerUniqueId,
        countryCode: updatedProfile.countryCode,
        country: updatedProfile.country,
        isBlocked: updatedProfile.isBlocked,
        creationDate: formatDate(updatedProfile.createdAt),
        profilePhoto: updatedProfile.profilePhoto,
        walletBalance: formatMinutesToMMSS(walletBalance?.balance) || "0:00"
      }
    });

    res.status(200).json({ message: "Profile deleted successfully." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
