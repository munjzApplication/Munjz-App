import consultationDetails from "../../../../models/Admin/consultantModels/consultationModel.js";
import Consultant from "../../../../models/Consultant/User.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import Dividend from "../../../../models/Admin/adminModels/dividendModel.js";
import Earnings from "../../../../models/Consultant/consultantEarnings.js";
import { sendNotificationToConsultant } from "../../../../helper/consultant/notificationHelper.js";
import { sendNotificationToCustomer } from "../../../../helper/customer/notificationHelper.js";
export const handleConsultationDetails = async (req, res, next) => {
  try {
    const {
      consultantId,
      customerId,
      consultationRating,
      consultationDate,
      consultationDuration,
      stringFeedback
    } = req.body;

    if (!consultantId || !customerId) {
      return res.status(400).json({
        message: "Consultant  and customer  are required."
      });
    }

    if (!consultationDuration || typeof consultationDuration !== "number") {
      return res.status(400).json({
        message: "Consultation duration must be a valid number."
      });
    }

    const consultant = await Consultant.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const countryCode = customer.countryCode;

    const dividend = await Dividend.findOne({ countryCode });
    if (!dividend) {
      return res
        .status(404)
        .json({ message: "Dividend details not found for the country." });
    }

    const ratingKey = `star${consultationRating}`;
    const ratingDividend = dividend.rates.get(ratingKey);

    if (!ratingDividend) {
      return res.status(404).json({
        message: `No dividend found for the rating: ${ratingKey}`
      });
    }

    const consultationAmountPerMinute = ratingDividend.dividend;
    const consultationAmountPerSecond = consultationAmountPerMinute / 60;
    const consultantShare = consultationDuration * consultationAmountPerSecond;

    const newConsultationDetails = new consultationDetails({
      consultantShare,
      consultantEmail: consultant.email,
      consultantId,
      customerId,
      consultationRating,
      consultationDate,
      consultationDuration,
      stringFeedback,
      customerEmail: customer.email
    });

    await newConsultationDetails.save();

    const wallet = await Wallet.findOne({ customerId });
    if (wallet) {
      if (wallet.balance >= consultantShare) {
        wallet.balance -= consultantShare;
        await wallet.save();

        await sendNotificationToConsultant(
          consultantId,
          `Your wallet has been debited with ${consultantShare} AED for the consultation with ${consultant.email}. Your current balance is ${wallet.balance} AED.`,
          "Wallet Update: Consultation Payment"
        );
      } else {
        return res.status(400).json({
          message: "Insufficient wallet balance to deduct the consultant share."
        });
      }
    } else {
      return res.status(404).json({
        message: "Wallet not found for the consultant."
      });
    }

    let earnings = await Earnings.findOne({ consultantId });
    if (!earnings) {
      earnings = new Earnings({ consultantId, totalEarnings: consultantShare });
    } else {
      earnings.totalEarnings += consultantShare;
    }

    await earnings.save();
    const notificationMessage = `Your consultation with ${customer.email} has been completed. You have earned ${consultantShare} AED.`;

    await sendNotificationToConsultant(
      consultantId,
      notificationMessage,
      "Consultation Completed"
    );

    await sendNotificationToCustomer(
      customerId,
      `Your consultation with ${consultant.email} has been completed successfully. Thank you for your feedback.`,
      "Consultation Completed"
    );
    

    return res.status(201).json({
      message:
        "Consultation details saved, wallet updated, and total earnings updated successfully.",
      data: newConsultationDetails
    });
  } catch (error) {
    next(error);
  }
};
