import axios from "axios";
import currencyMap from "../../helper/currencyMap.js";

export const getCurrencyFromCountryCode = (countryCode) => {
  if (!countryCode) return "AED";
  return currencyMap[countryCode.toUpperCase()] || "AED";
};

/**
 * Formats an amount with corresponding currency (e.g., AED 200.00).
 */
export const formatAmountWithCurrency = (amount, countryCode) => {
  const currency = getCurrencyFromCountryCode(countryCode);
  return `${currency} ${Number(amount).toFixed(2)}`;
};




export const getExchangeRate = async (fromCurrency, toCurrency) => {


  try {
    const apiKey = "9063cdbf5e26edef4abc3d85";

    // Fetch exchange rates for the 'fromCurrency'
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`);
    const rates = response.data.conversion_rates;

    // Return the exchange rate for the target 'toCurrency'
    return rates[toCurrency];
  } catch (error) {
    console.error("Error fetching exchange rates:", error.message);
    throw new Error("Failed to fetch exchange rates");
  }
};