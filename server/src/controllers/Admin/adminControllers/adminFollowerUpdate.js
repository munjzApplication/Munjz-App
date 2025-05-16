import courtServiceDetailsModel from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";

export const adminFollowerUpdate = async (req, res, next) => {
  try {
    const { courtServiceID, followerName } = req.body;

    if (!courtServiceID || !followerName) {
      return res.status(400).json({
        message: "Court service ID and follower name are required.",
      });
    }


    const updatedCase = await courtServiceDetailsModel.findOneAndUpdate(
      { courtServiceID },
      { $set: { follower: followerName } },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({
        message: "Court service case not found.",
      });
    }

    return res.status(200).json({
      message: "Follower name uploaded successfully.",
      data: updatedCase,
    });
  } catch (error) {
    next(error)
  }
};
