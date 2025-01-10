import { saveBankDetails } from "./bankDetailsController.js";
import { savePersonalDetails } from "./personalDetailsController.js";
import { uploadIDProof } from "./idProofController.js";

export const handleConsultantAction = async (req, res, next) => {
  const { actionType } = req.body;

  try {
    if (!actionType) {
      return res.status(400).json({ error: "Action type is required" });
    }

    switch (actionType) {
      case "bankDetails":
        return await saveBankDetails(req, res, next);
      case "personalDetails":
        return await savePersonalDetails(req, res, next);
      case "idProof":
        return await uploadIDProof(req, res, next);
      default:
        return res.status(400).json({ error: "Invalid action type" });
    }
  } catch (error) {
    next(error);
  }
};
