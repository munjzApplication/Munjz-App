import BankDetails from "../../models/Consultant/bankDetails.js";
import ConsultantProfile from "../../models/Consultant/User.js";
export const saveBankDetails = async (req, res, next) => {
  const consultantId = req.user._id;
  const { holderName, accountNumber, bankName, iban } = req.body;

  if (!consultantId || !holderName || !accountNumber || !bankName || !iban) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const BankDetailsData = new BankDetails({
      consultantId,
      holderName,
      accountNumber,
      bankName,
      iban
    });

    await BankDetailsData.save();
    const consultantDetails = await ConsultantProfile.findById(consultantId);
    console.log("popopop", consultantDetails);

    res.status(200).json({
      message: "Bank details saved successfully",
      BankDetails: BankDetailsData
    });
  } catch (error) {
    next(error);
  }
};
