import Earnings from "../../models/Consultant/consultantEarnings.js";
import ConsultantProfile from "../../models/Consultant/User.js";
import CustomerProfile from "../../models/Customer/customerModels/customerModel.js";
import {
  getCurrencyFromCountryCode,
  getExchangeRate
} from "../../helper/customer/currencyHelper.js";
import { formatDate } from "../../helper/dateFormatter.js";

export const getConsultantEarnings = async (req, res, next) => {
  try {
    const consultantId = req.user._id;

    // Fetch consultant details
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Fetch consultant earnings
    const consultantEarnings = await Earnings.findOne({ consultantId });
    if (!consultantEarnings) {
      return res.status(404).json({ message: "Consultant earnings not found" });
    }

    // Get consultant's preferred currency
    const consultantCurrency = await getCurrencyFromCountryCode(
      consultant.countryCode
    );
    console.log("Consultant Currency:", consultantCurrency);

    // Validate earnings activity
    if (!Array.isArray(consultantEarnings.activity)) {
      return res
        .status(400)
        .json({ message: "No activities found in consultant earnings" });
    }

    let totalConvertedEarnings = 0; // Store the total earnings after conversion

    // Process activities with currency conversion, date formatting, and customer name retrieval
    const updatedActivities = await Promise.all(
      consultantEarnings.activity.map(async activity => {
        const { amount, currency, date, customerId } = activity;
        let convertedAmount = amount;
        let convertedCurrency = currency;

        // Convert only if the currency is different from consultant's currency
        if (currency !== consultantCurrency) {
          const exchangeRate = await getExchangeRate(
            currency,
            consultantCurrency
          );
          convertedAmount = parseFloat((amount * exchangeRate).toFixed(2));
          convertedCurrency = consultantCurrency;
          console.log(
            `Converted ${amount} ${currency} to ${convertedAmount} ${consultantCurrency}`
          );
        }

        // Add converted amount to total earnings
        totalConvertedEarnings += convertedAmount;

        // Fetch customer name
        const customer = await CustomerProfile.findById(customerId).select(
          "Name"
        );
        const customerName = customer ? customer.Name : "Unknown";

        return {
          customerId,
          customerName,
          amount: convertedAmount,
          currency: convertedCurrency,
          status: activity.status,
          date: formatDate(date),
          _id: activity._id
        };
      })
    );

    // Update total earnings in the database
    consultantEarnings.totalEarnings = totalConvertedEarnings;
    await consultantEarnings.save();

    return res.status(200).json({
      message: "Consultant earnings successfully fetched",
      consultantEarnings: {
        _id: consultantEarnings._id,
        consultantId: consultantEarnings.consultantId,
        consultantName: consultant.Name,
        totalEarnings: totalConvertedEarnings,
        currency: consultantCurrency,
        __v: consultantEarnings.__v,
        activity: updatedActivities
      }
    });
  } catch (error) {
    console.error("Error fetching consultant earnings:", error);
    return next(error);
  }
};

export const convertEarningsToAED = async (req, res, next) => {
  try {
    const consultantId = req.user._id;
    const { totalEarnings, currency } = req.body;

    // Find consultant profile
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Get consultant's preferred currency
    const consultantCurrency = await getCurrencyFromCountryCode(
      consultant.countryCode
    );
    console.log("Consultant Currency:", consultantCurrency);

    let convertedAmount;
    let convertedCurrency = "AED";

    if (currency !== "AED") {
      // Case 1: Convert to AED (consultant's earnings in another currency)
      const exchangeRateToAED = await getExchangeRate(currency, "AED");
      convertedAmount = parseFloat(
        (totalEarnings * exchangeRateToAED).toFixed(2)
      );
      console.log(
        `Converted ${totalEarnings} ${currency} to ${convertedAmount} AED`
      );
    } else if (consultantCurrency !== "AED") {
      // Case 2: Convert from AED to consultant's original currency
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
      // Case 3: Already in AED, no conversion needed
      convertedAmount = totalEarnings;
      console.log(
        `No conversion needed, total earnings: ${convertedAmount} AED`
      );
    }

    // Respond with the converted earnings
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
