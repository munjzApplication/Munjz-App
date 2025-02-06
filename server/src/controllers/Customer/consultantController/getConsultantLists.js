import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import ConsultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getConsultantLists = async (req, res, next) => {
  try {
    // Step 1: Aggregate consultant data with average ratings in a single query
    const consultants = await ConsultantProfile.aggregate([
      // Lookup for PersonalDetails
      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "_id",
          foreignField: "consultantId",
          as: "personalDetails",
        },
      },
      {
        $unwind: {
          path: "$personalDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          profilePicture: "$personalDetails.profilePicture",
          country: "$personalDetails.country",
          languages: "$personalDetails.languages",
          areaOfPractices: "$personalDetails.areaOfPractices",
          experience: "$personalDetails.experience",
          biography: "$personalDetails.biography",
        },
      },
      // Remove the personalDetails field
      {
        $project: {
          personalDetails: 0,
          password: 0,
          email: 0,
          phoneNumber: 0,
          emailVerified: 0,
          isBlocked: 0,
          __v: 0,
        },
      },
      // Lookup for IDProof to ensure status is 'approved'
      {
        $lookup: {
          from: "consultant_idproofs",
          localField: "_id",
          foreignField: "consultantId",
          as: "idProof",
        },
      },
      {
        $unwind: {
          path: "$idProof",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "idProof.status": "approved",
        },
      },
      // Project to exclude the idProof data
      {
        $project: {
          idProof: 0,
        },
      },
      // Lookup for ConsultationDetails to calculate average rating
      {
        $lookup: {
          from: "consultationdetails", // Ensure this matches your collection name
          localField: "_id",
          foreignField: "consultantId",
          as: "consultations",
        },
      },
      {
        $addFields: {
          consultationRating: {
            $cond: {
              if: { $gt: [{ $size: "$consultations" }, 0] }, 
              then: {  $round: [{ $avg: "$consultations.consultationRating" }, 2] }, 
              else: 0, 
            },
          },
        },
      },
      // Remove the consultations field
      {
        $project: {
          consultations: 0,
        },
      },
      { $sort: { creationDate: -1 } },
    ]);

    // Format the creationDate for each consultant
    const formattedConsultants = consultants.map((consultant) => {
      consultant.creationDate = formatDate(consultant.creationDate);
      return consultant;
    });

    res.status(200).json({
      message: "Consultant Lists fetched successfully",
      data: formattedConsultants,
    });
  } catch (error) {
    next(error);
  }
};