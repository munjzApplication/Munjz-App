import PersonalDetails from "../../models/Consultant/personalDetails.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
export const savePersonalDetails = async (req, res, next) => {
  const consultantId = req.user._id;
  const { country, languages, areaOfPractices, experience, biography } =
    req.body;
  const profilePicture = req.file;

  // Ensure that the comma-separated strings are converted to arrays
  const languagesArray = languages
    ? languages.split(",").map((lang) => lang.trim())
    : [];
  const areaOfPracticesArray = areaOfPractices
    ? areaOfPractices.split(",").map((area) => area.trim())
    : [];

  if (
    !profilePicture ||
    !consultantId ||
    !country ||
    !languagesArray.length ||
    !areaOfPracticesArray.length ||
    !experience ||
    !biography
  ) {
    return res
      .status(400)
      .json({ error: "All fields are required, including profile picture." });
  }

  try {
    // Upload profile picture to S3 and specify the 'profileImages' folder
    const profilePictureUrl = await uploadFileToS3(
      profilePicture,
      "profileImages"
    );

    const personalDetailsData = new PersonalDetails({
      consultantId,
      profilePicture: profilePictureUrl,
      country,
      languages: languagesArray,
      areaOfPractices: areaOfPracticesArray,
      experience,
      biography
    });

    await personalDetailsData.save();

    res.status(200).json({
      message: "Personal details saved successfully.",
      personalDetails: personalDetailsData
    });
  } catch (error) {
    next(error);
  }
};
