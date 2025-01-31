import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import ConsultationDetails from "../../../models/Consultant/consultationModel.js";
import { formatDate } from "../../../helper/dateFormatter.js"; // Import the helper function

export const getConsultantLists = async (req, res, next) => {
  try {
    const consultants = await ConsultantProfile.aggregate([
      // Lookup for PersonalDetails
      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "_id",
          foreignField: "consultantId",
          as: "personalDetails"
        }
      },
      {
        $unwind: {
          path: "$personalDetails",
          preserveNullAndEmptyArrays: true
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
      // Remove the personalDetails field
      {
        $project: {
          personalDetails: 0,
          password: 0,
          email: 0,
          phoneNumber: 0,
          emailVerified: 0,
          isBlocked: 0,
          __v: 0
        }
      },
      // Lookup for ConsultationDetails and calculate rating
      {
        $lookup: {
          from: "consultationdetails",
          localField: "email",
          foreignField: "consultantEmail",
          as: "consultationDetails"
        }
      },
      {
        $addFields: {
          consultationRating: {
            $cond: {
              if: { $gt: [{ $size: "$consultationDetails" }, 0] },
              then: { $avg: "$consultationDetails.consultationRating" },
              else: 0.0
            }
          }
        }
      },
      {
        $project: {
          consultationDetails: 0 // Exclude full consultation details if not needed
        }
      },
      { $sort: { creationDate: -1 } }
    ]);

    // Format the createdDate field after aggregation
    const formattedConsultants = consultants.map(consultant => {
      consultant.creationDate = formatDate(consultant.creationDate); // Apply the formatDate function
      return consultant;
    });

    res.status(200).json({
      message: "Consultant Lists fetched successfully",
      data: formattedConsultants
    });
  } catch (error) {
    next(error);
  }
};
