import axios from "axios";

export const getCurrencyFromCountryCode = async (countryCode) => {
    console.log("Country Code:", countryCode);

  try {
    const response = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    return response.data[0]?.currencies
      ? Object.keys(response.data[0].currencies)[0] 
      : null;
  } catch (error) {
    console.error("Error fetching currency:", error);
    return null;
  }
};




export const getExchangeRate = async (fromCurrency, toCurrency) => {
    console.log("fromCurrency", fromCurrency);
    console.log("toCurrency", toCurrency);
    
    try {
      const apiKey = "9063cdbf5e26edef4abc3d85"; // Replace with your actual API key
      
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