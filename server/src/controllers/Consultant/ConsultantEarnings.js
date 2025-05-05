import Earnings from "../../models/Consultant/consultantModel/consultantEarnings.js";
import ConsultationActivity from "../../models/Consultant/consultantModel/consultationActivity.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import CustomerProfile from "../../models/Customer/customerModels/customerModel.js";
import WithdrawalActivity from "../../models/Consultant/consultantModel/withdrawalActivity .js";
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

    // Fetch consultant earnings & profile in parallel
    const [earnings, consultant] = await Promise.all([
      Earnings.findOne({ consultantId: consultantID }).select("totalEarnings currency").lean(),
      ConsultantProfile.findById(consultantID).select("Name").lean()
    ]);  

    // Default values if earnings or consultant profile is missing
    const totalEarnings = earnings?.totalEarnings || 0;
    const currency = earnings?.currency || "AED";
    const consultantName = consultant?.Name || "Unknown Consultant";

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
          type: { $literal: "Consultation" },
          customerId: "$customerId", 
          amount: 1,
          date: 1,
          currency: 1,
          status: 1,
          customerName: { $ifNull: ["$customerDetails.Name", "Unknown Customer"] }
        }
      }
    ]);  

    // Fetch withdrawal activities
    const withdrawalActivities = await WithdrawalActivity.find({ consultantId: consultantID })
      .sort({ date: -1 })
      .select("amount currency status date")
      .lean();  

    // Format withdrawals
    const formattedWithdrawals = withdrawalActivities.map((withdrawal) => ({
      type: "Withdrawal",
      amount: withdrawal.amount,
      date: withdrawal.date,
      currency: withdrawal.currency,
      status: withdrawal.status,
    }));  

    // Merge and sort activities
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
      consultantName,
      totalEarnings,
      currency,
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
 

    let convertedAmount = totalEarnings;
    let convertedCurrency = currency;

    if (currency === "AED" && consultantCurrency !== "AED") {
      // Convert AED to consultant's currency
      const exchangeRateToOriginal = await getExchangeRate("AED", consultantCurrency);
      convertedAmount = parseFloat((totalEarnings * exchangeRateToOriginal).toFixed(2));
      convertedCurrency = consultantCurrency;

    } 
    else if (currency !== "AED" && currency === consultantCurrency) {
      // Convert consultant's currency to AED
      const exchangeRateToAED = await getExchangeRate(consultantCurrency, "AED");
      convertedAmount = parseFloat((totalEarnings * exchangeRateToAED).toFixed(2));
      convertedCurrency = "AED";

      console.log(`Converted ${totalEarnings} ${consultantCurrency} to ${convertedAmount} AED`);
    } 
    else {
      console.log(`No conversion needed, total earnings: ${convertedAmount} ${currency}`);
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
