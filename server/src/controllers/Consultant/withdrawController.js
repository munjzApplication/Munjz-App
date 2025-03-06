import WithdrawalRequest from "../../models/Consultant/consultantModel/WithdrawRequest.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import Earnings from "../../models/Consultant/consultantModel/consultantEarnings.js";
import { notificationService } from "../../service/sendPushNotification.js";

export const getWithdrawalDatas = async (req, res, next) => {
  try {
    const consultantId = req.user._id;

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Get withdrawal requests and sort them in descending order by createdAt (or any other date field)
    const withdrawals = await WithdrawalRequest.find({ consultantId }).sort({
      time: -1
    });

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(200).json({
        message: "Withdrawal requests retrieved successfully",
        withdrawals: []
      });
    }


    res.status(200).json({
      message: "Withdrawal requests retrieved successfully",
      withdrawals
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const requestWithdrawal = async (req, res, next) => {
  try {
    const consultantId = req.user._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    // Fetch consultant details
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    if (!consultant.Name) {
      return res.status(400).json({ message: "Consultant name is missing" });
    }

    // Fetch consultant's earnings
    const earnings = await Earnings.findOne({ consultantId });
    if (!earnings || earnings.totalEarnings < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Optional: Prevent multiple pending withdrawal requests
    const existingRequest = await WithdrawalRequest.findOne({
      consultantId,
      currentStatus: "pending"
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending withdrawal request" });
    }

    // Create withdrawal request entry
    const withdrawal = new WithdrawalRequest({
      consultantId,
      amount,
      currentStatus: "pending"
    });

    await withdrawal.save();

    // Notify Consultant
    await notificationService.sendToConsultant(
      consultantId,
      "Withdrawal Request Submitted",
      `Your withdrawal request of ${amount} AED has been submitted successfully and is currently pending approval.`
    );

    // Notify Admin
    await notificationService.sendToAdmin(
      "New Withdrawal Request",
      `${consultant.Name} has requested a withdrawal of ${amount} AED. Please review and process the request.`
    );

    res
      .status(201)
      .json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    next(error);
  }
};
