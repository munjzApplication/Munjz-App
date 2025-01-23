import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import IdProof from "../../../models/Consultant/idProof.js";

export const getAllConsultantData = async (req, res) => {
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
          _id: 0,
          Id: "$ConsultantProfile.consultantUniqueId",
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

    const groupedConsultants = {
      active: [],
      pending: [],
      declined: []
    };

    consultantData.forEach(consultant => {
      if (consultant.idProofStatus === "approved") {
        groupedConsultants.active.push(consultant);
      } else if (consultant.idProofStatus === "pending") {
        groupedConsultants.pending.push(consultant);
      } else if (consultant.idProofStatus === "rejected") {
        groupedConsultants.declined.push(consultant);
      }
    });

    console.log(groupedConsultants);

    res.status(200).json(groupedConsultants);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const getConsultantDocs = async (req, res) => {
    try {
        const { consultantId } = req.query;
    
        const consultantDocs = await IdProof.findOne({ consultantId });
    
        res.status(200).json(consultantDocs);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
    }