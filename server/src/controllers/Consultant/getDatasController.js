import BankDetails from "../../models/Consultant/bankDetails.js";
import IDProof from "../../models/Consultant/idProof.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import { formatDate } from "../../helper/dateFormatter.js";

export const getBankDetails = async (req, res) => {
  try {
    const { consultantId } = req.params;

    console.log(consultantId);

    const consultantBankDetails = await BankDetails.findOne({ consultantId });

    if (consultantBankDetails) {
      const bankDetailsObject = consultantBankDetails.toObject();

      if (bankDetailsObject.creationDate) {
        bankDetailsObject.creationDate = formatDate(
          bankDetailsObject.creationDate
        );
      }

      res.status(200).json({
        message: "Consultant Bank Details fetched successfully.",
        consultantBankDetails: bankDetailsObject
      });
    } else {
      res.status(404).json({ message: "No bank details found." });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { consultantId } = req.params;

    console.log(consultantId);

    const consultantIdProof = await IDProof.findOne({ consultantId });

    if (consultantIdProof) {
      const IdProofDetailsObject = consultantIdProof.toObject();

      if (IdProofDetailsObject.creationDate) {
        IdProofDetailsObject.creationDate = formatDate(
          IdProofDetailsObject.creationDate
        );
      }

      res.status(200).json({
        message: "Consultant Documents  fetched successfully.",
        consultantIdProof: IdProofDetailsObject
      });
    } else {
      res.status(404).json({ message: "No ID proof details found." });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPersonalDetails = async (req, res) => {
  try {
    const { consultantId } = req.params;

    const consultantPersonalDetails = await PersonalDetails.findOne({
      consultantId
    });

    if (consultantPersonalDetails) {
      const PersonalDetailsObject = consultantPersonalDetails.toObject();

      if (PersonalDetailsObject.createdAt) {
        PersonalDetailsObject.createdAt = formatDate(
          PersonalDetailsObject.createdAt
        );
      }

      res.status(200).json({
        message: "Consultant Personal Details fetched successfully.",
        consultantPersonalDetails: PersonalDetailsObject
      });
    } else {
      res.status(404).json({ message: "No personal details found." });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
