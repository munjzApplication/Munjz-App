import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import IdProof from "../../../models/Consultant/idProof.js";
import BankDetails from "../../../models/Consultant/bankDetails.js";
import consultantProfile from "../../../models/Consultant/User.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getAllConsultantData = async (req, res , next) => {
  try {
    const { status } = req.query;

    const matchStage = status ? { "IdProof.status": status } : {};

    const consultantData = await PersonalDetails.aggregate([
      {
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "ConsultantProfile"
        }
      },
      {
        $unwind: "$ConsultantProfile"
      },
      {
        $lookup: {
          from: "consultant_idproofs",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "IdProof"
        }
      },
      {
        $unwind: {
          path: "$IdProof",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: matchStage
      },
      {
        $project: {
          _id: "$ConsultantProfile._id",
          ConsultantId: "$ConsultantProfile.consultantUniqueId",
          Name: "$ConsultantProfile.Name",
          email: "$ConsultantProfile.email",
          creationDate: "$ConsultantProfile.creationDate",
          phoneNumber: "$ConsultantProfile.phoneNumber",
          country: "$country",
          profilePicture: "$profilePicture",
          idProofStatus: "$IdProof.status",
          isBlocked: "$ConsultantProfile.isBlocked"

        }
      }
    ]);
    // Function to format creationDate
    consultantData.forEach((consultant) => {
      if (consultant.creationDate) {
        consultant.creationDate = formatDate(consultant.creationDate);
      }
    });

    const ConsultantDatas = {
      active: [],
      pending: [],
      declined: []
    };

    consultantData.forEach(consultant => {
      if (consultant.isBlocked) {  
        ConsultantDatas.declined.push(consultant);
      } else
      if (consultant.idProofStatus === "approved") {
        ConsultantDatas.active.push(consultant);
      } else if (consultant.idProofStatus === "pending") {
        ConsultantDatas.pending.push(consultant);
      } else if (consultant.idProofStatus === "rejected") {
        ConsultantDatas.declined.push(consultant);
      }
    });

   

    return res.status(200).json({
      message: "Consultant data fetched successfully.",
      ConsultantDatas
    });
  } catch (error) {
    next(error);
  }
};



export const getConsultantDocs = async (req, res) => {
  try {
    const { consultantId } = req.params;
    console.log(consultantId);

    // Now proceed with the query since the consultantId is valid
    const consultantDocs = await IdProof.findOne({ consultantId });
    console.log(consultantDocs);

    // If no documents found, return an error message
    if (!consultantDocs) {
      return res.status(404).json({
    
        message: "Consultant not found.",
      });
    }

    // Return the consultant documents if found
    res.status(200).json({
      
      message: "Consultant Documents fetched successfully.",
      consultantDocs,
    });
  } catch (error) {
    next(error);
    
  }
};

export const getConsultantDocuments = async (req, res) => {
  try {
    const { consultantId } = req.params;
    console.log(consultantId);

    // Now proceed with the query since the consultantId is valid
    const consultantDocs = await IdProof.findOne({ consultantId });
    console.log(consultantDocs);

    // If no documents found, return an error message
    if (!consultantDocs) {
      return res.status(404).json({
      
        message: "Consultant not found.",
      });
    }

    // Return the consultant documents if found
    res.status(200).json({
      
      message: "Consultant Documents fetched successfully.",
      consultantDocs,
    });
  } catch (error) {
    next(error);
    
  }
}

export const getConsultantBankDetails = async (req, res) => {
  try {
    const { consultantId } = req.params;
    console.log(consultantId);

    // Now proceed with the query since the consultantId is valid
    const bankDetails = await BankDetails.findOne({ consultantId });
    console.log(bankDetails);

    // If no documents found, return an error message
    if (!bankDetails) {
      return res.status(404).json({
        
        message: "Consultant not found.",
      });
    }

    // Return the consultant documents if found
    res.status(200).json({
      
      message: "Consultant Bank Details fetched successfully.",
      bankDetails,
    });
  } catch (error) {
    next(error);
    
  }
}

export const getConsultantData = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    console.log(consultantId);

    // Query consultant data excluding the "password" field
    const consultantData = await consultantProfile.findOne({ _id: consultantId }).select(
      "-password -resetOtpHash -resetOtpExpiry"
    );
    
    console.log(consultantData);

    // If no documents found, return an error message
    if (!consultantData) {
      return res.status(404).json({
        message: "Consultant not found.",
      });
    }

    // Return the consultant documents if found
    res.status(200).json({
      message: "Consultant Data fetched successfully.",
      consultantData,
    });
  } catch (error) {
    next(error);
  }
};
