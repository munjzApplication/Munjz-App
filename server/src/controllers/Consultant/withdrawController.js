import WithdrawalRequest from "../../models/Consultant/WithdrawRequest.js";
import ConsultantProfile from "../../models/Consultant/User.js";
import PersonalDetails from "../../models/Consultant/personalDetails.js";
import Earnings from "../../models/Consultant/consultantEarnings.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js"; 



export const getWithdrawalDatas = async (req, res, next) => {
  try {
    const consultantId = req.user._id; 

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Get withdrawal requests and sort them in descending order by createdAt (or any other date field)
    const withdrawals = await WithdrawalRequest.find({ consultantId }).sort({ time: -1 });

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found" });
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
      return res.status(400).json({ message: "You already have a pending withdrawal request" });
    }

    // Create withdrawal request entry
    const withdrawal = new WithdrawalRequest({
      consultantId,
      amount,
      currentStatus: "pending"
    });

    await withdrawal.save();

    // Notify admin
    const notification = new Notification({
      notificationDetails: {
        type: "Withdrawal Request",
        title: "New Withdrawal Request",
        message: `${consultant.Name} has requested a withdrawal of ${amount} AED.`,
        additionalDetails: {
          consultantId: consultant._id,
          amount,
          status: "pending",
          requestDate: new Date()
        }
      }
    });

    await notification.save();

    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    next(error);
  }
};
