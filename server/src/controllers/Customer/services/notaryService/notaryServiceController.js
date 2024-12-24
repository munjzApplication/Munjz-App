import {
  saveNotaryCase,
  saveNotaryDocuments,
  saveNotaryPayment
} from "../../../../helper/notaryService/notaryCaseHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";

export const saveNotaryServiceDetails = async (req, res, next) => {
  const { customerID } = req.params;

  try {
    const {
      serviceName,
      selectedServiceCountry,
      caseDescription,
      paymentAmount,
      paidCurrency,
      paymentMethod,
      transactionId,
      paymentDate
    } = req.body;

    // Validate customer
    const customer = await Customer.findById(customerID);
    if (!customer) {
      return res.status(400).json({ error: "Invalid customer email" });
    }
    // Check if the case is already registered
    const existingCase = await NotaryCase.findOne({
      customerID,
      serviceName,
      selectedServiceCountry
    });
    if (existingCase) {
      return res.status(409).json({
        error: "A Notary case with this service name is already registered."
      });
    }
    let customerName = customer.Name;
    // Determine payment status
    const casePaymentStatus =
      paymentAmount && paidCurrency && paymentMethod && transactionId
        ? "paid"
        : "free";
    // Save Notary Case
    const { notaryCase, notaryServiceID } = await saveNotaryCase({
      customerID,
      serviceName,
      selectedServiceCountry,
      caseDescription,
      requesterEmail: customer.email,
      casePaymentStatus
    });

    // Save Documents
    if (req.files && req.files.length > 0) {
      await saveNotaryDocuments(req.files, notaryServiceID, notaryCase._id);
    }

    // Save Payment
    if (paymentAmount && paidCurrency && paymentMethod && transactionId) {
      const payment = await saveNotaryPayment({
        notaryServiceID,
        notaryCaseId: notaryCase._id,
        paymentAmount,
        paidCurrency,
        serviceName,
        selectedServiceCountry,
        paymentMethod,
        transactionId,
        paymentDate,
        customerName
      });

      return res.status(201).json({
        message:
          "Notary case, original documents, and payment saved successfully",
        notaryCase,
        payment
      });
    } else {
      const notification = new Notification({
        notificationDetails: {
          type: "Case Registration",
          title: "Notary Service Registered Without Payment",
          message: `The Notary service "${serviceName}" has been successfully registered for ${customerName} without a payment.`,
          additionalDetails: {
            customerName,
            serviceName,
            country: selectedServiceCountry,
            caseDescription,
            paymentStatus: "unpaid"
          }
        }
      });

      await notification.save();

      res.status(201).json({
        message: "Notary case saved successfully without payment",
        notaryCase
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { country } = req.params;
    const services = await NotaryServicePricing.find({
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
