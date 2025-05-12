import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import Consultant from "../../../../models/Consultant/ProfileModel/User.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import Dividend from "../../../../models/Admin/adminModels/dividendModel.js";
import Earnings from "../../../../models/Consultant/consultantModel/consultantEarnings.js";
import ConsultationActivity from "../../../../models/Consultant/consultantModel/consultationActivity.js";
import PersonalDetails from "../../../../models/Consultant/ProfileModel/personalDetails.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import mongoose from "mongoose";
import { io } from "../../../../socket/socketController.js";
import { formatDate,formatMinutesToMMSS,formatToHourMinute } from "../../../../helper/dateFormatter.js";
import {
  getCurrencyFromCountryCode,
  getExchangeRate
} from "../../../../helper/customer/currencyHelper.js";

export const handleConsultationDetails = async (req, res, next) => {
  const session = await mongoose.startSession();
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
      return res
        .status(400)
        .json({ message: "Consultant ID and Customer ID are required." });
    }

    if (!callDurationInSecond || typeof callDurationInSecond !== "number") {
      return res
        .status(400)
        .json({ message: "Call duration must be a valid number in seconds." });
    }

    // Fetch consultant, customer, and personal details in parallel
    const [consultant, customer, consultantPersonalDetails] = await Promise.all(
      [
        Consultant.findById(consultantID).select("email countryCode Name"),
        Customer.findById(customerID).select("email Name"),
        PersonalDetails.findOne({ consultantId: consultantID }).select(
          "country"
        )
      ]
    );

    const countryCode =
      consultant.countryCode || consultantPersonalDetails.country;

    if (!consultant || !customer || !consultantPersonalDetails) {
      return res.status(404).json({
        message:
          "Consultant, Customer, or Consultant's personal details not found."
      });
    }

    // Fetch dividend for the consultant's country
    let dividend = await Dividend.findOne({ countryCode });

    if (!dividend) {
      // If no dividend for the consultant's country, use AED as default
      dividend = await Dividend.findOne({ countryCode: "AE" });
      if (!dividend) {
        return res
          .status(404)
          .json({ message: "Default dividend details (AE) not found." });
      }
    }

    const ratingKey = `star${reviewRating}`;
    const ratingDividend = dividend.rates.get(ratingKey);

    if (!ratingDividend) {
      return res
        .status(404)
        .json({ message: `No dividend found for the rating: ${ratingKey}` });
    }

    const consultationAmountPerSecond = ratingDividend.dividend / 60;
    let consultantShare = callDurationInSecond * consultationAmountPerSecond;
    consultantShare = parseFloat(consultantShare.toFixed(2)); // Round consultant's share

    // If the dividend is not in AED, convert the consultant's share to AED
    if (dividend.countryCode !== "AE") {
      const localCurrency = await getCurrencyFromCountryCode(countryCode);

      const conversionRate = await getExchangeRate(localCurrency, "AED");
      consultantShare *= conversionRate;
      consultantShare = parseFloat(consultantShare.toFixed(2)); // Round the converted share
    }

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
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Insufficient balance in wallet." });
    }

    wallet.balance -= callDurationInSecond / 60;
    wallet.walletActivity.push({
      status: "-",
      minute: callDurationInSecond / 60,
      time: new Date()
    });
    await wallet.save({ session });

    // Ensure the consultant's earnings record exists
    let earnings = await Earnings.findOne({
      consultantId: consultantID
    }).session(session);
    if (!earnings) {
      earnings = new Earnings({
        consultantId: consultantID,
        totalEarnings: consultantShare,
        currency: "AED" // Always AED
      });
    } else {
      earnings.totalEarnings += consultantShare;
    }

    // Round total earnings to 2 decimal places before saving
    earnings.totalEarnings = parseFloat(earnings.totalEarnings.toFixed(2));
    await earnings.save({ session });

    // Emit real-time earnings update to consultant
    const consultantNamespace = io.of("/consultant");
    consultantNamespace
      .to(consultantID.toString())
      .emit("consultant-earnings", {
        consultantId: consultantID,
        consultantName: consultant.Name,
        totalEarnings: earnings.totalEarnings,
        currency: earnings.currency || "AED",
        activity: {
          type: "Consultation",
          amount: consultantShare,
          date: formatDate(new Date()),
          currency: "AED",
          status: "completed",
          customerId: customerID,
          customerName: customer.Name
        }
      });

    // Create a new consultation activity entry
    const consultationActivity = new ConsultationActivity({
      consultantId: consultantID,
      customerId: customerID,
      amount: consultantShare,
      currency: "AED",
      status: "completed",
      date: new Date()
    });

    // Round activity amount to 2 decimal places
    consultationActivity.amount = parseFloat(
      consultationActivity.amount.toFixed(2)
    );
    await consultationActivity.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Send notifications
    const consultantNotificationMessage = `Your consultation with ${customer.email} has been completed. You have earned ${consultantShare} AED.`;
    const customerNotificationMessage = `Your consultation with ${consultant.email} has been completed successfully. Thank you for your feedback.`;
    const adminNotificationMessage = `A consultation between ${consultant.email} (Consultant) and ${customer.email} (Customer) has been completed.`;

    const notificationResults = await Promise.allSettled([
      notificationService.sendToConsultant(
        consultantID,
        "Consultation Completed",
        consultantNotificationMessage
      ),
      notificationService.sendToCustomer(
        customerID,
        "Consultation Completed",
        customerNotificationMessage
      ),
      notificationService.sendToAdmin(
        "Consultation Completed",
        adminNotificationMessage
      )
    ]);

    const adminNamespace = io.of("/admin");
    adminNamespace.emit("new-consultation", {
      Consultation  :{
      _id: newConsultationDetails._id,
      consultantShare: consultantShare,
      consultationRating: reviewRating,
      consultationDuration: formatMinutesToMMSS(callDurationInSecond / 60),
      stringFeedback: reviewText,
      consultationDate: formatDate(new Date()),
      customerName: customer.Name,
      consultantId: consultantID,
      customerId: customerID,
      consultantName: consultant.Name,
      consultantCurrency: "AED",
      }
    });

    consultantNamespace.to(consultantID.toString()).emit("consultant-consultation-datas", {
      message: "Consultation data retrieved successfully",
      data: {
        _id: newConsultationDetails._id,
        consultantShare: consultantShare,
        consultationDuration: formatMinutesToMMSS(callDurationInSecond / 60),
        consultationDate:new Date(),
        consultantId: consultantID,
        CustomerId: customerID,
        customerName: customer.Name,
        CustomerEmail: customer.email,
        CustomerProfilePicture: customer.profilePicture,
        consultationHours: formatToHourMinute(new Date()),
      },
    });
  

    return res.status(201).json({
      message: "Consultation details saved successfully.",
      data: newConsultationDetails
    });
  } catch (error) {
    console.error("Error in handleConsultationDetails:", error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  } finally {
    session.endSession();
  }
};
