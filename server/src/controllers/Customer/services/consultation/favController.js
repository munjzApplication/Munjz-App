import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import CustomerFavorites from "../../../../models/Customer/customerModels/customerFavorites.js";
import ConsultantProfile from "../../../../models/Consultant/User.js";
import PersonalDetails from "../../../../models/Consultant/personalDetails.js";
export const addFavoriteConsultant = async (req, res, next) => {
  try {
    const { consultantId } = req.body;
    const customerId = req.user._id; // Retrieve customerId from the token

    const customer = await CustomerProfile.findOne({ _id: customerId }); // Mongoose query to fetch the customer

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
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

    if (isFavorite) {
      return res.status(409).json({
        message: "Consultant is already in favorites"
      });
    }

    // Add consultant to favorites in the CustomerFavorites model
    const newFavorite = new CustomerFavorites({
      customerId: customerId,
      consultantId: consultantId
    });
    await newFavorite.save();

    res.status(200).json({
      message: "Consultant added to favorites successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get Favorite Consultants
export const getFavoriteConsultants = async (req, res, next) => {
  try {
    const customerId = req.user._id; // Retrieve customerId from the token

    const favorites = await CustomerFavorites.aggregate([
      {
        $match: { customerId: customerId }, // Match documents where customerId matches
      },
      {
        $lookup: {
          from: 'consultant_profiles', // The collection to join
          localField: 'consultantId', // Field from CustomerFavorites
          foreignField: '_id', // Field from ConsultantProfile
          as: 'consultantDetails', // Alias for the joined data
        },
      },
      {
        $unwind: {
          path: '$consultantDetails',
          preserveNullAndEmptyArrays: true, // Include documents even if consultantDetails is empty or null
        },
      },
      {
        $lookup: {
          from: 'consultant_personaldetails', // The collection to join
          localField: 'consultantId', // Field from CustomerFavorites
          foreignField: 'consultantId', // Field from Consultant_PersonalDetails
          as: 'consultantPersonalDetails', // Alias for the joined data
        },
      },
      {
        $unwind: {
          path: '$consultantPersonalDetails',
          preserveNullAndEmptyArrays: true, // Include documents even if consultantPersonalDetails is empty or null
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          consultantId: '$consultantDetails._id',
          Name: '$consultantDetails.Name',
          email: '$consultantDetails.email',
          consultantUniqueId: '$consultantDetails.consultantUniqueId',
          creationDate: '$consultantDetails.creationDate',
          isBlocked:'$consultantDetails.isBlocked',
          profilePicture: '$consultantPersonalDetails.profilePicture', // Include profile picture
          country: '$consultantPersonalDetails.country', 
          languages: "$consultantPersonalDetails.languages",
          areaOfPractices: "$consultantPersonalDetails.areaOfPractices",
          experience: "$consultantPersonalDetails.experience",
          biography: "$consultantPersonalDetails.biography"
        },
      },
      
      
    ]);

    res.status(200).json({
      favorites: favorites || [],
    });
  } catch (error) {
    next(error);
  }
};




