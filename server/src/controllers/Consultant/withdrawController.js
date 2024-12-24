import WithdrawalRequest from "../../models/Admin/consultantModels/WithdrawRequest.js";
import ConsultantProfile from "../../models/Consultant/User.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";  // Assuming this is where the Notification model is

export const requestWithdrawal = async (req, res, next) => {
  try {
    const { consultantId, amount, countryCode, currency = "AED" } = req.body;

  
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    if (!consultant.Name) {
      return res.status(400).json({ message: "Consultant name is missing" });
    }

    // Create withdrawal request entry
    const withdrawal = new WithdrawalRequest({
      consultantId,
      consultantName: consultant.Name,
      amount,
      countryCode,
      currency,
      email: consultant.email,
      imageUrl: consultant.imageUrl,
      currentStatus: "unread"
    });

    await withdrawal.save();

  

    const notification = new Notification({
      notificationDetails: {
        type: "Withdrawal Request",
        title: "New Withdrawal Request",
        message: `${consultant.Name} has requested a withdrawal of ${amount} ${currency}.`,
        additionalDetails: {
          consultantId: consultant._id,
          amount,
          currency,
          countryCode,
          email: consultant.email,
          status: "unread",
          requestDate: new Date(),
        },
      },
    });


    await notification.save();
  
    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    next(error);
  }
};
