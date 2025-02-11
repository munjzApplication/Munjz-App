import WithdrawalRequest from "../../../models/Consultant/WithdrawRequest.js";
import Earnings from "../../../models/Consultant/consultantEarnings.js";
import Notification from "../../../models/Admin/notificationModels/notificationModel.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";
import breakDetails from "../../../models/Consultant/bankDetails.js";
import {formatDate} from "../../../helper/dateFormatter.js";
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
      { $unwind: { path: "$personalDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "consultant_bankdetails",  // Correct collection name
          localField: "consultantId",
          foreignField: "consultantId",
          as: "bankDetails"
        }
      },
      
      { $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          amount: 1,
          currentStatus: 1,
          consultantId: 1,
          currentStatus: 1,
          transferId: 1,
          paymentMethod: 1,
          time:1,
          Name: "$consultant.Name",
          email: "$consultant.email",
          profilePicture: "$personalDetails.profilePicture",
          bankDetails: "$bankDetails",
          
        }
      }
    ]);

    withdrawals.forEach((withdrawal) => {
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

    // Find withdrawal request
    const withdrawal = await WithdrawalRequest.findById(requestId);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (
      withdrawal.currentStatus !== "pending" &&
      withdrawal.currentStatus !== "processing"
    ) {
      return res
        .status(400)
        .json({ message: "Withdrawal request is already processed" });
    }

    // Handle status updates
    if (status === "processing") {
      withdrawal.currentStatus = "processing";
    } else if (status === "declined") {
      withdrawal.currentStatus = "declined";
    } else if (status === "completed") {
      if (!paymentMethod || !transferId) {
        return res
          .status(400)
          .json({
            message:
              "Payment method and transfer ID are required for completed status"
          });
      }

      // Get consultant earnings
      const earnings = await Earnings.findOne({
        consultantId: withdrawal.consultantId
      });
      if (!earnings || earnings.totalEarnings < withdrawal.amount) {
        return res
          .status(400)
          .json({ message: "Insufficient balance in consultant's earnings" });
      }

      // Deduct the amount from earnings
      earnings.totalEarnings -= withdrawal.amount;
      await earnings.save();

      // Update withdrawal request
      withdrawal.currentStatus = "completed";
      withdrawal.paymentMethod = paymentMethod;
      withdrawal.transferId = transferId;
      withdrawal.approvalDate = new Date();
    } else {
      return res.status(400).json({ message: "Invalid status update" });
    }

    await withdrawal.save();

    // Send notification to consultant
    const notification = new Notification({
      notificationDetails: {
        type: "Withdrawal Update",
        title: `Withdrawal ${status}`,
        message: `Your withdrawal request of ${withdrawal.amount} AED has been marked as ${status}.`,
        additionalDetails: {
          consultantId: withdrawal.consultantId,
          amount: withdrawal.amount,
          status,
          approvalDate: withdrawal.approvalDate || null,
          paymentMethod: paymentMethod || null,
          transferId: transferId || null
        }
      }
    });

    await notification.save();

    res
      .status(200)
      .json({ message: `Withdrawal request updated to ${status}`, withdrawal });
  } catch (error) {
    next(error);
  }
};
