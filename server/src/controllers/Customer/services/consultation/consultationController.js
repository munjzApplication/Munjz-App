import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import Consultant from "../../../../models/Consultant/User.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import Dividend from "../../../../models/Admin/adminModels/dividendModel.js";
import Earnings from "../../../../models/Consultant/consultantEarnings.js";
import PersonalDetails from "../../../../models/Consultant/personalDetails.js";
import { sendNotificationToConsultant } from "../../../../helper/consultant/notificationHelper.js";
import { sendNotificationToCustomer } from "../../../../helper/customer/notificationHelper.js";
import mongoose from 'mongoose';

export const handleConsultationDetails = async (req, res, next) => {
  const session = await mongoose.startSession();  // Start a session for transaction
  session.startTransaction();

  try {
    const {
      consultantID,
      customerID,
      reviewRating,
      callDurationInSecond,
      reviewText
    } = req.body;

    // Validate inputs
    if (!consultantID || !customerID) {
      return res.status(400).json({ message: "Consultant ID and Customer ID are required." });
    }

    if (!callDurationInSecond || typeof callDurationInSecond !== "number") {
      return res.status(400).json({ message: "Call duration must be a valid number in seconds." });
    }

    // Fetch consultant, customer, and personal details in parallel
    const [consultant, customer, consultantPersonalDetails] = await Promise.all([
      Consultant.findById(consultantID).select("email"),
      Customer.findById(customerID).select("email"),
      PersonalDetails.findOne({ consultantId: consultantID }).select("country")
    ]);

    if (!consultant || !customer || !consultantPersonalDetails) {
      return res.status(404).json({ message: "Consultant, Customer, or Consultant's personal details not found." });
    }

    // Fetch dividend details
    let dividend = await Dividend.findOne({ countryCode: consultantPersonalDetails.country });
    if (!dividend) {
      dividend = await Dividend.findOne({ countryCode: "AE" });
      if (!dividend) {
        return res.status(404).json({ message: "Default dividend details (AE) not found." });
      }
    }

    const ratingKey = `star${reviewRating}`;
    const ratingDividend = dividend.rates.get(ratingKey);
    if (!ratingDividend) {
      return res.status(404).json({ message: `No dividend found for the rating: ${ratingKey}` });
    }

    const consultationAmountPerSecond = ratingDividend.dividend / 60;
    let consultantShare = callDurationInSecond * consultationAmountPerSecond;

    // Round to 2 decimal places
    consultantShare = parseFloat(consultantShare.toFixed(2));

    // Save consultation details
    const newConsultationDetails = new consultationDetails({
      consultantId: consultantID,
      customerId: customerID,
      consultationRating: reviewRating,
      consultationDuration: callDurationInSecond,
      stringFeedback: reviewText,
      consultantShare
    });
    await newConsultationDetails.save({ session });

    // Handle wallet deduction
    const wallet = await Wallet.findOne({ customerId: customerID });
    if (!wallet || wallet.balance < callDurationInSecond / 60) {
      await session.abortTransaction();  // Rollback transaction if balance is insufficient
      return res.status(400).json({ message: "Insufficient balance in wallet." });
    }

    wallet.balance -= callDurationInSecond / 60;
    wallet.walletActivity.push({ status: "-", minute: callDurationInSecond / 60, time: new Date() });
    await wallet.save({ session });

    // Update consultant earnings
    let earnings = await Earnings.findOne({ consultantId: consultantID });
    if (!earnings) {
      earnings = new Earnings({ consultantId: consultantID, totalEarnings: consultantShare });
    } else {
      earnings.totalEarnings += consultantShare;
    }

    // Round total earnings to 2 decimal places before saving
    earnings.totalEarnings = parseFloat(earnings.totalEarnings.toFixed(2));

    await earnings.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send notifications
    const consultantNotificationMessage = `Your consultation with ${customer.email} has been completed. You have earned ${consultantShare} AED.`;
    const customerNotificationMessage = `Your consultation with ${consultant.email} has been completed successfully. Thank you for your feedback.`;

    await Promise.all([
      sendNotificationToConsultant(consultantID, consultantNotificationMessage, "Consultation Completed"),
      sendNotificationToCustomer(customerID, customerNotificationMessage, "Consultation Completed")
    ]);

    return res.status(201).json({ message: "Consultation details saved successfully.", data: newConsultationDetails });

  } catch (error) {
    console.error("Error in handleConsultationDetails:", error);
    await session.abortTransaction();  // Rollback transaction in case of error
    session.endSession();
    next(error);
  }
};
