import BankDetails from "../../models/Consultant/bankDetails.js";


export const getBankDetails = async (req, res) => {
    try {
      const { consultantId } = req.params;
      console.log(consultantId);
  
      const consultantBankDetails = await BankDetails.findOne({ consultantId });
  
      // Function to format the date
      const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const day = date.getDate();
        const month = date.getMonth() + 1; 
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
      };
  
      // Check and format the creationDate
      if (consultantBankDetails) {
        // Convert Mongoose document to plain object
        const bankDetailsObject = consultantBankDetails.toObject();
  
        // Format the creationDate field
        if (bankDetailsObject.creationDate) {
          bankDetailsObject.creationDate = formatDate(bankDetailsObject.creationDate);
        }
  
        res.status(200).json({
          message: "Consultant Bank Details fetched successfully.",
          consultantBankDetails: bankDetailsObject,
        });
      } else {
        res.status(404).json({ message: "No bank details found." });
      }
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };
  
  