import WithdrawalRequest from "../../../models/Consultant/consultantModel/WithdrawRequest.js";
import Earnings from "../../../models/Consultant/consultantModel/consultantEarnings.js";
import WithhdrawalActivity from "../../../models/Consultant/consultantModel/withdrawalActivity .js";
import { notificationService } from "../../../service/sendPushNotification.js";
import { formatDate } from "../../../helper/dateFormatter.js";
import { io } from "../../../socket/socketController.js";

export const getWithdrawalDatas = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.aggregate([
      {
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "personalDetails"
        }
      },
      {
        $unwind: { path: "$personalDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "consultant_bankdetails",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "bankDetails"
        }
      },

      { $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true } },

      { $sort: { time: -1 } },

      {
        $project: {
          _id: 1,
          amount: 1,
          currentStatus: 1,
          consultantId: 1,
          currentStatus: 1,
          transferId: 1,
          paymentMethod: 1,
          time: 1,
          Name: "$consultant.Name",
          email: "$consultant.email",
          profilePicture: "$personalDetails.profilePicture",
          bankDetails: "$bankDetails"
        }
      }
    ]);

    withdrawals.forEach(withdrawal => {
      withdrawal.time = formatDate(withdrawal.time);
    });

    if (!withdrawals.length) {
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

export const updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, paymentMethod, transferId } = req.body;

    const withdrawal = await WithdrawalRequest.findById(requestId);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    // Block updates if the current status is "completed"
    if (withdrawal.currentStatus === "completed") {
      return res
        .status(400)
        .json({ message: "Completed withdrawals cannot be changed" });
    }

    const earnings = await Earnings.findOne({
      consultantId: withdrawal.consultantId
    });
    if (!earnings) {
      return res.status(400).json({ message: "Consultant earnings not found" });
    }

    // Handle status updates
    if (status === "processing") {
      withdrawal.currentStatus = "processing";
    } else if (status === "declined") {
      withdrawal.currentStatus = "declined";
    } else if (status === "completed") {
      if (!paymentMethod || !transferId) {
        return res.status(400).json({
          message:
            "Payment method and transfer ID are required for completed status"
        });
      }

      // Check if the consultant has enough earnings
      if (earnings.totalEarnings < withdrawal.amount) {
        return res
          .status(400)
          .json({ message: "Insufficient balance in consultant's earnings" });
      }

      // Deduct the amount from total earnings
      earnings.totalEarnings -= withdrawal.amount;
      await earnings.save();

      // Update withdrawal request details
      withdrawal.currentStatus = "completed";
      withdrawal.paymentMethod = paymentMethod;
      withdrawal.transferId = transferId;
      withdrawal.approvalDate = new Date();
    } else {
      return res.status(400).json({ message: "Invalid status update" });
    }

    await withdrawal.save();

    const withdrawalActivity = new WithhdrawalActivity({
      consultantId: withdrawal.consultantId,
      amount: withdrawal.amount,
      currency: "AED",
      status: withdrawal.currentStatus,
      date: new Date()
    });

    await withdrawalActivity.save();

    // Send notification to consultant
    const notificationMessage = `Your withdrawal request of ${withdrawal.amount} AED has been marked as ${status}.`;
    await notificationService.sendToConsultant(
      withdrawal.consultantId,
      "Withdrawal Update",
      notificationMessage
    );

    // Emit Socket Event for Real-Time Update

    const adminNamespace = io.of("/admin");
    adminNamespace.emit("withdrawal-status-update", {
      consultantId: withdrawal.consultantId,
      message: `Withdrawal request updated to ${status}`,
      _id: withdrawal._id.toString(),
      currentStatus: withdrawal.currentStatus
    });

    const consultantNamespace = io.of("/consultant");
    consultantNamespace
      .to(withdrawal.consultantId.toString())
      .emit("withdrawal-status-update", {
        consultantId: withdrawal.consultantId,
        message: `Withdrawal request updated to ${status}`,
        activity: {
          type: "Withdrawal",
          amount: withdrawal.amount,
          date: formatDate(new Date()),
          currency: "AED",
          status: withdrawal.currentStatus
        },
        withdrawals: {
          _id: withdrawal._id.toString(),
          consultantId: withdrawal.consultantId.toString(),
          amount: withdrawal.amount,
          currentStatus: withdrawal.currentStatus,
          paymentMethod: withdrawal.paymentMethod,
          transferId: withdrawal.transferId,
          time: formatDate(withdrawal.time)
        }
      });

    res.status(200).json({
      message: `Withdrawal request updated to ${status}`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};
