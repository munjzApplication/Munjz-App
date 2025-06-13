import ConsultantProfile from "../../../models/Consultant/ProfileModel/User.js";
import Favorite from "../../../models/Customer/customerModels/customerFavorites.js";
import { formatDate } from "../../../helper/dateFormatter.js";

const getPaginationStages = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return [{ $skip: skip }, { $limit: limit }];
};

export const getConsultantLists = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const {
      searchTerm = "",
      category = "",
      topRated = false,
      isOnline = false,
      page = 1,
      limit = 10
    } = req.query;

    const favorites = await Favorite.find({ customerId }).select(
      "consultantId"
    );
    const favoriteIds = favorites.map(f => f.consultantId.toString());

    const matchStage = {
      Name: { $ne: "Deleted_User" },
      isBlocked: { $ne: true },
      ...(searchTerm && {
        Name: { $regex: searchTerm, $options: "i" }
      }),
      ...(isOnline === "true" && { isOnline: true }) 
    };
    
    if (isOnline === "true") {
      matchStage.isOnline = true; 
    }
    

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "_id",
          foreignField: "consultantId",
          as: "personalDetails"
        }
      },
      {
        $unwind: { path: "$personalDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $match: {
          ...(category && {
            "personalDetails.areaOfPractices": {
              $regex: category,
              $options: "i"
            }
          })
        }
      },
      {
        $addFields: {
          profilePicture: "$personalDetails.profilePicture",
          country: "$personalDetails.country",
          languages: "$personalDetails.languages",
          areaOfPractices: "$personalDetails.areaOfPractices",
          experience: "$personalDetails.experience",
          biography: "$personalDetails.biography"
        }
      },
      {
        $project: {
          personalDetails: 0,
          password: 0,
          phoneNumber: 0,
          emailVerified: 0,
          __v: 0
        }
      },
      {
        $lookup: {
          from: "consultant_idproofs",
          localField: "_id",
          foreignField: "consultantId",
          as: "idProof"
        }
      },
      { $unwind: { path: "$idProof", preserveNullAndEmptyArrays: false } },
      { $match: { "idProof.status": "approved" } },
      {
        $lookup: {
          from: "consultationdetails",
          localField: "_id",
          foreignField: "consultantId",
          as: "consultations"
        }
      },
      {
        $addFields: {
          consultationRating: {
            $cond: {
              if: { $gt: [{ $size: "$consultations" }, 0] },
              then: {
                $round: [{ $avg: "$consultations.consultationRating" }, 2]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          consultations: 0,
          idProof: 0
        }
      },
      {
        $sort:
          topRated === "true"
            ? { consultationRating: -1 }
            : { creationDate: -1 }
      },
      ...getPaginationStages(parseInt(page), parseInt(limit))
    ];

    const consultants = await ConsultantProfile.aggregate(pipeline);

    const formatted = consultants.map(c => ({
      ...c,
      creationDate: formatDate(c.creationDate),
      isFav: favoriteIds.includes(c._id.toString())
    }));

    res.status(200).json({
      message: "Consultant Lists fetched successfully",
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};
