import WithdrawalRequest from "../../../../models/Consultant/WithdrawRequest.js";
import Earnings from "../../../../models/Consultant/consultantEarnings.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";

export const updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params; // Withdrawal request ID from URL params
    const { status, paymentMethod, transferId } = req.body; // New status and optional payment details

    // Find withdrawal request
    const withdrawal = await WithdrawalRequest.findById(requestId);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (withdrawal.currentStatus !== "pending" && withdrawal.currentStatus !== "processing") {
      return res.status(400).json({ message: "Withdrawal request is already processed" });
    }

    // Handle status updates
    if (status === "processing") {
      withdrawal.currentStatus = "processing";
    } else if (status === "declined") {
      withdrawal.currentStatus = "declined";
    } else if (status === "completed") {
      if (!paymentMethod || !transferId) {
        return res.status(400).json({ message: "Payment method and transfer ID are required for completed status" });
      }

      // Get consultant earnings
      const earnings = await Earnings.findOne({ consultantId: withdrawal.consultantId });
      if (!earnings || earnings.totalEarnings < withdrawal.amount) {
        return res.status(400).json({ message: "Insufficient balance in consultant's earnings" });
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

    res.status(200).json({ message: `Withdrawal request updated to ${status}`, withdrawal });
  } catch (error) {
    next(error);
  }
};
