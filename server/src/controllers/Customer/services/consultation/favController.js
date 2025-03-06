import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import CustomerFavorites from "../../../../models/Customer/customerModels/customerFavorites.js";
import ConsultantProfile from "../../../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../../../models/Consultant/ProfileModel/personalDetails.js";
import { formatDate } from "../../../../helper/dateFormatter.js";
export const updateFavoriteConsultant = async (req, res, next) => {
  try {
    const { consultantId, action } = req.body;
    const customerId = req.user._id;

    // Validate the action
    const validActions = ["addfav", "removefav"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'addfav' or 'removefav'."
      });
    }

    // Check if the customer exists
    const customer = await CustomerProfile.findOne({ _id: customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Ensure favorites is an array
    if (!Array.isArray(customer.favorites)) {
      customer.favorites = [];
    }

    // Check if consultant is already in favorites
    const isFavorite = await CustomerFavorites.findOne({
      customerId: customerId,
      consultantId: consultantId
    });

    // Action: Add to favorites
    if (action === "addfav") {
      if (isFavorite) {
        return res.status(409).json({
          message: "Consultant is already in favorites",
          isFav: true
        });
      }

      const newFavorite = new CustomerFavorites({
        customerId: customerId,
        consultantId: consultantId
      });
      await newFavorite.save();

      return res.status(200).json({
        message: "Consultant added to favorites successfully",
        isFav: true
      });
    }

    // Action: Remove from favorites
    if (action === "removefav") {
      if (!isFavorite) {
        return res.status(404).json({
          message: "Consultant is not in favorites",
          isFav: false
        });
      }

      await CustomerFavorites.deleteOne({
        customerId: customerId,
        consultantId: consultantId
      });

      return res.status(200).json({
        message: "Consultant removed from favorites successfully",
        isFav: false
      });
    }

  } catch (error) {
    next(error);
  }
};


export const getFavoriteConsultants = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    const favorites = await CustomerFavorites.aggregate([
      {
        $match: { customerId: customerId }
      },
      {
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultantDetails"
        }
      },
      {
        $unwind: {
          path: "$consultantDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "consultantPersonalDetails"
        }
      },
      {
        $unwind: {
          path: "$consultantPersonalDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "consultationdetails",
          localField: "consultantId",
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
        $match: {
          "consultantDetails._id": { $exists: true }
        }
      },
      {
        $project: {
          _id: 0,
          _id: "$consultantDetails._id",
          Name: "$consultantDetails.Name",
          email: "$consultantDetails.email",
          consultantUniqueId: "$consultantDetails.consultantUniqueId",
          creationDate: "$consultantDetails.creationDate",
          isBlocked: "$consultantDetails.isBlocked",
          profilePicture: "$consultantPersonalDetails.profilePicture",
          country: "$consultantPersonalDetails.country",
          languages: "$consultantPersonalDetails.languages",
          areaOfPractices: "$consultantPersonalDetails.areaOfPractices",
          experience: "$consultantPersonalDetails.experience",
          biography: "$consultantPersonalDetails.biography",
          consultationRating: 1,
          isFav: { $literal: true }
        }
      }
    ]);

    // Format the creationDate for each consultant
    const formattedFavorites = favorites.map(favorite => {
      favorite.creationDate = formatDate(favorite.creationDate);
      return favorite;
    });

    res.status(200).json({
      message: "Favorite Consultants fetched successfully",
      data: formattedFavorites || []
    });
  } catch (error) {
    next(error);
  }
};
