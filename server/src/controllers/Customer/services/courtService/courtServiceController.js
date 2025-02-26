import {
  saveCourtCase,
  saveCourtDocuments,
  saveCourtPayment
} from "../../../../helper/courtService/courtCaseHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import { notificationService } from "../../../../service/sendPushNotification.js";

// export const saveCourtServiceDetails = async (req, res, next) => {
//   const { customerID } = req.params;

//   try {
//     const {
//       serviceName,
//       selectedServiceCountry,
//       caseDescription,
//       paymentAmount,
//       paidCurrency,
//       paymentMethod,
//       transactionId,
//       paymentDate
//     } = req.body;

//     // Validate customerID
//     const customer = await Customer.findById(customerID);
//     if (!customer) {
//       return res.status(400).json({ error: "Invalid customer ID" });
//     }

//     // Check if the case is already registered
//     const existingCase = await CourtCase.findOne({
//       customerID,
//       serviceName,
//       selectedServiceCountry
//     });
//     if (existingCase) {
//       return res.status(409).json({
//         error: "A court case with this service name is already registered."
//       });
//     }

//     let customerName = customer.Name;

//     // Determine payment status
//     const casePaymentStatus =
//       paymentAmount && paidCurrency && paymentMethod && transactionId
//         ? "paid"
//         : "free";

//     // Save Court Case
//     const { courtCase, courtServiceID } = await saveCourtCase({
//       customerID,
//       serviceName,
//       selectedServiceCountry,
//       caseDescription,
//       requesterEmail: customer.email,
//       casePaymentStatus 
//     });

//     // Save Documents
//     if (req.files && req.files.length > 0) {
//       await saveCourtDocuments(req.files, courtServiceID, courtCase._id);
//     }

//     // Save Payment (if provided)
//     if (casePaymentStatus === "paid") {
//       const payment = await saveCourtPayment({
//         courtServiceID,
//         courtCaseId: courtCase._id,
//         paymentAmount,
//         paidCurrency,
//         serviceName,
//         selectedServiceCountry,
//         paymentMethod,
//         transactionId,
//         paymentDate,
//         customerName
//       });

//       // Push Notification for Successful Payment
//       try {
//         await notificationService.sendToCustomer(
//           customerID,
//           "Court Service Registered Successfully",
//           `Your court service "${serviceName}" in "${selectedServiceCountry}" has been registered successfully. Payment of ${paymentAmount} ${paidCurrency} is complete.`
//         );
//       } catch (error) {
//         console.error("Error sending payment notification:", error);
//       }

//       return res.status(201).json({
//         message:
//           "Court case, original documents, and payment saved successfully",
//         courtCase,
//         payment
//       });
//     } else {
//       const notification = new Notification({
//         notificationDetails: {
//           type: "Case Registration",
//           title: "Court Service Registered Without Payment",
//           message: `The court service "${serviceName}" has been successfully registered for ${customerName} without a payment.`,
//           additionalDetails: {
//             customerName,
//             serviceName,
//             country: selectedServiceCountry,
//             caseDescription,
//             paymentStatus: "unpaid"
//           }
//         }
//       });

//       await notification.save();

//       // Push Notification for Unpaid Case
//       try {
//         await notificationService.sendToAdmin(
//           "Court Service Registered Without Payment",
//           `The court service "${serviceName}" for customer "${customerName}" in "${selectedServiceCountry}" has been registered without a payment.`,
//           {
//             customerID,
//             serviceName,
//             country: selectedServiceCountry,
//             caseDescription
//           }
//         );
//       } catch (error) {
//         console.error("Error sending unpaid notification:", error);
//       }

//       res.status(201).json({
//         message: "Court case saved successfully without payment",
//         courtCase
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };


export const getServices = async (req, res, next) => {
  try {
    const { country } = req.params;
    const services = await CourtServicePricing.find({
      [`BigPricingMaps.${country}`]: { $exists: true }
    })
      .select("serviceId BigPricingMaps")
      .populate("serviceId", "ServiceNameEnglish");

    if (!services || services.length === 0) {
      return res
        .status(404)
        .json({ message: "No services found for this country" });
    }

    const formattedServices = services.map(service => {
      const countryData = Object.fromEntries(service.BigPricingMaps)[country];
      return {
        serviceName: service.serviceId.ServiceNameEnglish,
        price: countryData[0],
        currency: countryData[1]
      };
    });

    res.status(200).json(formattedServices);
  } catch (error) {
    next(error);
  }
};
