import ConsultantProfile from "../../models/Consultant/User.js";

export const getConsultantProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated. Please log in." });
    }

    const userId = req.user._id;
    
    const profile = await ConsultantProfile.findById(userId).select("-password");

    if (!profile) {
      return res.status(404).json({ message: "Consultant profile not found." });
    }

    res.status(200).json({ message: "Profile fetched successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching the profile." });
  }
};
