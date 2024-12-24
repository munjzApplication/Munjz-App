import CallActivity from "../../../models/Customer/customerModels/callActivity.js";
import Notification from "../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
export const createCallActivity = async (req, res, next) => {
  try {
    const {
      consultantID,
      customerID,
      serviceName,
      activity,
      callID,
      tapedAmount
    } = req.body;

    if (
      !consultantID ||
      !customerID ||
      !serviceName ||
      !activity ||
      !callID ||
      tapedAmount === undefined
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required, including tapedAmount" });
    }

    const callActivity = new CallActivity({
      consultantID,
      customerID,
      serviceName,
      activity,
      callID,
      tapedAmount
    });

    const savedActivity = await callActivity.save();

    // Create a notification
    const notification = new Notification({
      notificationDetails: {
        type: "Call Activity",
        title: "New Call Activity Logged",
        message: `A new call activity has been logged for ${serviceName} with call ID ${callID}. Activity: ${activity}`,
        additionalDetails: {
          consultantID,
          customerID,
          serviceName,
          callID,
          activity,
          tapedAmount,
          status: "unread"
        }
      }
    });

    await notification.save();

    try {
      await notificationService.sendToConsultant(
        consultantID,
        "New Call Activity Logged",
        `A new call activity has been logged for ${serviceName} with call ID ${callID}. Activity: ${activity}`,
        { callID, serviceName, activity }
      );
    } catch (pushError) {
      console.error(
        "Error sending push notification to consultant:",
        pushError
      );
    }

    // Push notification for customer
    try {
      await notificationService.sendToCustomer(
        customerID,
        "New Call Activity Update",
        `Your service (${serviceName}) has been updated with a new call activity. Activity: ${activity}`,
        { callID, serviceName, activity }
      );
    } catch (pushError) {
      console.error("Error sending push notification to customer:", pushError);
    }
    res.status(201).json({ savedActivity, notification });
  } catch (error) {
    next(error);
  }
};
