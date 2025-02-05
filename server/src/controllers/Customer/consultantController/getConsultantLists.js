import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import ConsultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
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
          localField: "_id", // Match by consultant's _id
          foreignField: "consultantId", // consultantId in ConsultationDetails
          as: "consultationDetails"
        }
      },
      {
        $addFields: {
          consultationRating: {
            $cond: {
              if: { $gt: [{ $size: "$consultationDetails" }, 0] }, // If there are consultation details
              then: { $round: [{ $avg: "$consultationDetails.consultationRating" }, 2] }, // Calculate average rating and round to 2 decimals
              else: 0.0 // Default rating if no consultations exist
            }
          }
        }
      },
      {
        $project: {
          consultationDetails: 0 // Exclude full consultation details if not needed
        }
      },
      { $sort: { creationDate: -1 } } // Sort by creation date
    ]);

    // Format the createdDate field after aggregation
    const formattedConsultants = consultants.map((consultant) => {
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
