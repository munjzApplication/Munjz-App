import consultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import Consultant from "../../../models/Consultant/User.js";
import Customer from "../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import Dividend from "../../../models/Admin/adminModels/dividendModel.js";
import Earnings from "../../../models/Consultant/consultantEarnings.js";
import { sendNotificationToConsultant } from "../../../helper/consultant/notificationHelper.js";
import { sendNotificationToCustomer } from "../../../helper/customer/notificationHelper.js";

export const handleConsultationDetails = async (req, res, next) => {
  try {
    const {
      consultantID,
      customerID,
      reviewRating,
      dateTime,
      callDurationInSecond,
      reviewText,
    } = req.body;

    // Validate required fields
    if (!consultantID || !customerID) {
      return res.status(400).json({
        message: "Consultant ID and Customer ID are required.",
      });
    }

    if (!callDurationInSecond || typeof callDurationInSecond !== "number") {
      return res.status(400).json({
        message: "Call duration must be a valid number in seconds.",
      });
    }

    // Fetch consultant and customer details in parallel for better performance
    const [consultant, customer] = await Promise.all([
      Consultant.findById(consultantID).select("email"), // Fetch only the email if needed
      Customer.findById(customerID).select("countryCode email"), // Fetch only required fields
    ]);

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
console.log(customer);

    // Fetch dividend details based on the customer's country code
    const dividend = await Dividend.findOne({ countryCode: customer.countryCode });
    if (!dividend) {
      return res.status(404).json({
        message: "Dividend details not found for the customer's country.",
      });
    }

    // Calculate consultant share based on rating and duration
    const ratingKey = `star${reviewRating}`;
    const ratingDividend = dividend.rates.get(ratingKey);

    if (!ratingDividend) {
      return res.status(404).json({
        message: `No dividend found for the rating: ${ratingKey}`,
      });
    }

    const consultationAmountPerMinute = ratingDividend.dividend;
    const consultationAmountPerSecond = consultationAmountPerMinute / 60;
    const consultantShare = callDurationInSecond * consultationAmountPerSecond;

    // Save consultation details (without redundant email fields)
    const newConsultationDetails = new consultationDetails({
      consultantId: consultantID,
      customerId: customerID,
      consultationRating: reviewRating,
      consultationDate: dateTime,
      consultationDuration: callDurationInSecond,
      stringFeedback: reviewText,
      consultantShare,
    });

    await newConsultationDetails.save();

    // Deduct consultant share from the customer's wallet
    const wallet = await Wallet.findOne({ customerId: customerID });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found for the customer." });
    }

    // if (wallet.balance < consultantShare) {
    //   return res.status(400).json({
    //     message: "Insufficient wallet balance to deduct the consultant share.",
    //   });
    // }

    wallet.balance -= consultantShare;
    await wallet.save();

    // Update consultant's earnings
    let earnings = await Earnings.findOne({ consultantId: consultantID });
    if (!earnings) {
      earnings = new Earnings({ consultantId: consultantID, totalEarnings: consultantShare });
    } else {
      earnings.totalEarnings += consultantShare;
    }
    await earnings.save();

    // Send notifications
    const consultantNotificationMessage = `Your consultation with ${customer.email} has been completed. You have earned ${consultantShare} AED.`;
    const customerNotificationMessage = `Your consultation with ${consultant.email} has been completed successfully. Thank you for your feedback.`;

    await Promise.all([
      sendNotificationToConsultant(
        consultantID,
        consultantNotificationMessage,
        "Consultation Completed"
      ),
      sendNotificationToCustomer(
        customerID,
        customerNotificationMessage,
        "Consultation Completed"
      ),
    ]);

    return res.status(201).json({
      message:
        "Consultation details saved successfully.",
      data: newConsultationDetails,
    });
  } catch (error) {
    next(error);
  }
};