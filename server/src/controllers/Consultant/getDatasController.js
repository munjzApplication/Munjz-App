import BankDetails from "../../models/Consultant/bankDetails.js";
import IDProof from "../../models/Consultant/idProof.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import consultantUser from "../../models/Consultant/User.js";
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

    // Fetch consultant and ID proof details
    const consultant = await consultantUser.findOne({ _id: consultantId }).select("isBlocked");
    if (!consultant) {
      return res.status(404).json({ success: false, message: "Consultant not found." });
    }

    const consultantIdProof = await IDProof.findOne({ consultantId }).select("-__v");
    if (!consultantIdProof) {
      return res.status(404).json({ success: false, message: "No ID proof details found." });
    }

    // Determine and update status
    let status = consultant.isBlocked ? "declined" : consultantIdProof.status;
    if (status === "pending") status = "pending";
    if (status === "approved") status = "approved";

    // Format the ID proof details
    const IdProofDetailsObject = consultantIdProof.toObject();
    if (IdProofDetailsObject.creationDate) {
      IdProofDetailsObject.creationDate = formatDate(IdProofDetailsObject.creationDate);
    }

    // Update the status in the response object
    IdProofDetailsObject.status = status;

    // Respond with the updated document
    res.status(200).json({
      message: "Consultant documents fetched successfully.",
      data: { consultantIdProof: IdProofDetailsObject },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
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
