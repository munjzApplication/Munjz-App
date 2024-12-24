import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
export const addFavoriteConsultant = async (req, res,next) => {
  try {
    const { customerId, consultantId } = req.body;

    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Ensure favorites is an array
    if (!Array.isArray(customer.favorites)) {
      customer.favorites = [];
    }

    if (customer.favorites.includes(consultantId)) {
      return res.status(409).json({
        success: false,
        message: "Consultant is already in favorites"
      });
    }

    // Add consultant to favorites
    customer.favorites.push(consultantId);
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Consultant added to favorites successfully",
      favorites: customer.favorites
    });
  } catch (error) {
    next(error)
  }
};

// Get Favorite Consultants
export const getFavoriteConsultants = async (req, res , next) => {
  try {
    const customerId = req.params.customerId;

    const customer = await CustomerProfile.findById(customerId)
      .populate(
        "favorites",
        "Name email phoneNumber consultantUniqueId creationDate"
      )
      .lean();

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    if (customer.favorites && customer.favorites.length > 0) {
      return res.status(200).json({
        success: true,
        favorites: customer.favorites
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "No favorites found"
      });
    }
  } catch (error) {
    next(error)
  }
};
