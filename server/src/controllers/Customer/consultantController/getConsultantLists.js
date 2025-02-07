import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import ConsultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import Favorite from "../../../models/Customer/customerModels/customerFavorites.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getConsultantLists = async (req, res, next) => {
  try {
    // Step 1: Get customer ID from request (assuming customer ID is available in req.user)
    const customerId = req.user._id;

    // Step 2: Fetch customer's favorite consultants
    const favorites = await Favorite.find({ customerId }).select("consultantId");

    // Extract the list of favorite consultant IDs
    const favoriteConsultantIds = favorites.map(fav => fav.consultantId.toString());

    // Step 3: Aggregate consultant data with average ratings in a single query
    const consultants = await ConsultantProfile.aggregate([
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
      {
        $project: {
          personalDetails: 0,
          password: 0,
          phoneNumber: 0,
          emailVerified: 0,
          __v: 0,
          
        },
      },
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
      {
        $project: {
          idProof: 0,
        },
      },
      {
        $lookup: {
          from: "consultationdetails",
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
              then: { $round: [{ $avg: "$consultations.consultationRating" }, 2] }, 
              else: 0, 
            },
          },
        },
      },
      {
        $project: {
          consultations: 0,
        },
      },
      { $sort: { creationDate: -1 } },
    ]);

    // Step 4: Mark consultants as favorites
    const formattedConsultants = consultants.map((consultant) => {
      // Check if the consultant is in the customer's favorites
      const isFav = favoriteConsultantIds.includes(consultant._id.toString());
      consultant.creationDate = formatDate(consultant.creationDate);
      consultant.isFav = isFav; // Add isFav field
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
