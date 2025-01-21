import ConsultantProfile from "../../models/Consultant/User.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";

export const getConsultantProfile = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated. Please log in." });
    }

    const userId = req.user._id;

    // Fetch consultant profile
    const profile = await ConsultantProfile.findById(userId).select("-password");
    if (!profile) {
      return res.status(404).json({ message: "Consultant profile not found." });
    }

    // Fetch personal details (profilePic and country)
    const personalDetails = await PersonalDetails.findOne({ consultantId: userId }).select(
      "profilePicture country"
    );

    if (!personalDetails) {
      return res.status(404).json({ message: "Personal details not found." });
    }

    // Combine both results into a single response
    const combinedProfile = {
      ...profile.toObject(), // Convert Mongoose document to plain JavaScript object
      profilePicture: personalDetails.profilePicture,
      country: personalDetails.country,
    };

    res.status(200).json({ message: "Profile fetched successfully", profile: combinedProfile });
  } catch (error) {
    console.error("Error fetching consultant profile:", error);
    res.status(500).json({ message: "An error occurred while fetching the profile." });
  }
};
