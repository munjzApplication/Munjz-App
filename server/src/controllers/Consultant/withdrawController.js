import WithdrawalRequest from "../../models/Consultant/consultantModel/WithdrawRequest.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import Earnings from "../../models/Consultant/consultantModel/consultantEarnings.js";
import BankDetails from "../../models/Consultant/ProfileModel/bankDetails.js";
import { notificationService } from "../../service/sendPushNotification.js";
import { io } from "../../socket/socketController.js"
import { formatDate } from "../../helper/dateFormatter.js";

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

    // Fetch all necessary data in parallel
    const [consultant, earnings, existingRequest, bankDetails, profilePicture] = await Promise.all([
      ConsultantProfile.findById(consultantId),
      Earnings.findOne({ consultantId }),
      WithdrawalRequest.findOne({ consultantId, currentStatus: "pending" }),
      BankDetails.findOne({ consultantId }),
      PersonalDetails.findOne({ consultantId })
    ]);

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }
    if (!earnings || earnings.totalEarnings < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending withdrawal request" });
    }

    // Create withdrawal request
    const withdrawal = new WithdrawalRequest({
      consultantId,
      amount,
      currentStatus: "pending"
    });

    await withdrawal.save();

    // Send notifications
    notificationService.sendToConsultant(
      consultantId,
      "Withdrawal Request Submitted",
      `Your withdrawal request of ${amount} AED has been submitted successfully and is currently pending approval.`
    ).catch(console.error);

    notificationService.sendToAdmin(
      "New Withdrawal Request",
      `${consultant.Name} has requested a withdrawal of ${amount} AED. Please review and process the request.`
    ).catch(console.error);
console.log("profilePicture", profilePicture);

    // Emit event to admin namespace
    try {
      const adminNamespace = io.of("/admin");
      adminNamespace.emit("new-withdrawal-request", {
        id: withdrawal._id.toString(),
        consultantId: consultantId.toString(),
        amount: Number(amount),
        currentStatus: "pending",
        time: formatDate(new Date()),
        Name: consultant.Name,
        email: consultant.email,
        profilePicture: profilePicture,
        bankDetails: {
          _id: bankDetails._id.toString(),
          consultantId: bankDetails.consultantId.toString(),
          holderName: bankDetails.holderName,
          accountNumber: Number(bankDetails.accountNumber),
          bankName: bankDetails.bankName,
          iban: bankDetails.iban,
          creationDate: bankDetails.creationDate,
        }
      });
    } catch (emitErr) {
      console.error("Socket emit error:", emitErr);
    }

    res
      .status(201)
      .json({ message: "Withdrawal request submitted", withdrawal });

  } catch (error) {
    next(error);
  }
};

