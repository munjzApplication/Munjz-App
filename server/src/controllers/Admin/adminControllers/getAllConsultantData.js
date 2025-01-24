import mongoose from 'mongoose'; 
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import IdProof from "../../../models/Consultant/idProof.js";


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
          idProofStatus: "$IdProof.status"
        }
      }
    ]);
    // Function to format creationDate
    const formatDate = isoDate => {
      const date = new Date(isoDate);
      const day = date.getDate();
      const month = date.getMonth() + 1; // Months are zero-indexed
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    // Format the creationDate for each consultant
    consultantData.forEach(consultant => {
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
      if (consultant.idProofStatus === "approved") {
        ConsultantDatas.active.push(consultant);
      } else if (consultant.idProofStatus === "pending") {
        ConsultantDatas.pending.push(consultant);
      } else if (consultant.idProofStatus === "rejected") {
        ConsultantDatas.declined.push(consultant);
      }
    });

    console.log(ConsultantDatas);

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

    // Check if the consultantId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({
        
        message: "Invalid consultant ID format.",
      });
    }

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
