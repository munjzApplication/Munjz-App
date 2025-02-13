import Earnings from "../../models/Consultant/consultantEarnings.js";
import ConsultationActivity from "../../models/Consultant/consultationActivity.js";
import ConsultantProfile from "../../models/Consultant/User.js";
import CustomerProfile from "../../models/Customer/customerModels/customerModel.js";
import WithdrawalActivity from "../../models/Consultant/withdrawalActivity .js";
import {
  getCurrencyFromCountryCode,
  getExchangeRate
} from "../../helper/customer/currencyHelper.js";
import { formatDate } from "../../helper/dateFormatter.js";

export const getConsultantEarnings = async (req, res, next) => {
  try {
    const consultantID = req.user._id;

    if (!consultantID) {
      return res.status(400).json({ message: "Consultant ID is required." });
    }

    // Fetch consultant earnings & profile in parallel (Better Performance)
    const [earnings, consultant] = await Promise.all([
      Earnings.findOne({ consultantId: consultantID }).select("totalEarnings currency").lean(),
      ConsultantProfile.findById(consultantID).select("Name").lean()
    ]);

    if (!earnings) {
      return res.status(404).json({ message: "Earnings not found for the specified consultant." });
    }

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found." });
    }

    // Fetch consultation activities with customer info
    const consultationActivities = await ConsultationActivity.aggregate([
      { $match: { consultantId: consultantID } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDetails"
        }
      },
      { $unwind: { path: "$customerDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: { $literal: "Consultation" }, // Label activity type
          customerId: "$customerId", // Include customerId
          amount: 1,
          date: 1,
          currency: 1,
          status: 1,
          customerName: { $ifNull: ["$customerDetails.Name", "Unknown Customer"] }
        }
      }
    ]);

    // Fetch withdrawal activities (directly from Mongoose with lean())
    const withdrawalActivities = await WithdrawalActivity.find({ consultantId: consultantID })
      .sort({ date: -1 })
      .select("amount currency status date")
      .lean();

    // Format withdrawals to match consultation structure
    const formattedWithdrawals = withdrawalActivities.map((withdrawal) => ({
      type: "Withdrawal",
      amount: withdrawal.amount,
      date: withdrawal.date,
      currency: withdrawal.currency,
      status: withdrawal.status,
      
    }));

    // Merge and sort activities by date
    const combinedActivities = [...consultationActivities, ...formattedWithdrawals].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Format dates
    const formattedActivities = combinedActivities.map(activity => ({
      ...activity,
      date: formatDate(activity.date) 
    }));

    return res.status(200).json({
      consultantId: consultantID,
      consultantName: consultant.Name,
      totalEarnings: earnings.totalEarnings,
      currency: earnings.currency,
      activities: formattedActivities
    });

  } catch (error) {
    console.error("Error in getConsultantEarnings:", error);
    next(error);
  }
};



export const convertEarningsToLocalCurrency = async (req, res, next) => {
  try {
    const consultantId = req.user._id;
    const { totalEarnings, currency } = req.body;

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    const consultantCurrency = await getCurrencyFromCountryCode(
      consultant.countryCode
    );
    console.log("Consultant Currency:", consultantCurrency);

    let convertedAmount = totalEarnings;
    let convertedCurrency = "AED";

    if (currency === "AED" && consultantCurrency !== "AED") {
      // Convert AED to consultant's own currency
      const exchangeRateToOriginal = await getExchangeRate(
        "AED",
        consultantCurrency
      );
      convertedAmount = parseFloat(
        (totalEarnings * exchangeRateToOriginal).toFixed(2)
      );
      convertedCurrency = consultantCurrency;

      console.log(
        `Converted ${totalEarnings} AED to ${convertedAmount} ${consultantCurrency}`
      );
    } else {
      console.log(
        `No conversion needed, total earnings: ${convertedAmount} ${currency}`
      );
    }

    return res.status(200).json({
      message: "Earnings conversion successful",
      convertedEarnings: {
        amount: convertedAmount,
        currency: convertedCurrency
      }
    });
  } catch (error) {
    console.error("Error converting earnings: ", error.message);
    return next(error);
  }
};
