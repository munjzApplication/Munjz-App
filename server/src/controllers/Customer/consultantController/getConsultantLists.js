import ConsultantProfile from "../../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../../models/Consultant/ProfileModel/personalDetails.js";
import ConsultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import Favorite from "../../../models/Customer/customerModels/customerFavorites.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getConsultantLists = async (req, res, next) => {
  try {
   
    const customerId = req.user._id;

    const favorites = await Favorite.find({ customerId }).select("consultantId");

    const favoriteConsultantIds = favorites.map(fav => fav.consultantId.toString());

    const consultants = await ConsultantProfile.aggregate([
      {
        $match: {
          Name: { $ne: "Deleted_User" }, 
          isBlocked: { $ne: true },
        },
      },
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

    
    const formattedConsultants = consultants.map((consultant) => {

      const isFav = favoriteConsultantIds.includes(consultant._id.toString());
      consultant.creationDate = formatDate(consultant.creationDate);
      consultant.isFav = isFav; 
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
