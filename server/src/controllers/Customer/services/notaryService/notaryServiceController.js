import {
  saveNotaryCase,
  saveNotaryDocuments,
  saveNotaryPayment,
} from "../../../../helper/notaryService/notaryCaseHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import mongoose from "mongoose"; 

export const saveNotaryServiceDetails = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user._id;
    const { serviceName, selectedServiceCountry, caseDescription, paymentAmount, paidCurrency, paymentDate } = req.body;
    
    // Validate customer
    const customer = await Customer.findById(customerId).lean(); // Use lean() for better performance
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Invalid customer" });
    }
    const customerName = customer.Name;

    if (!paymentAmount || !paidCurrency) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Payment is required for registration." });
    }

    // Save Notary Case
    const { notaryCase, notaryServiceID } = await saveNotaryCase(
      { customerId, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus: "paid" },
      { session } // Use transaction session
    );

    // Save Documents if any
    if (req.files?.length > 0) {
      await saveNotaryDocuments(req.files, notaryServiceID, notaryCase._id, session);
    }

    // Save Payment
    const payment = await saveNotaryPayment(
      { notaryServiceID, notaryCaseId: notaryCase._id, paymentAmount, paidCurrency, serviceName, selectedServiceCountry, paymentDate, customerName },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Notary case registered successfully",
    
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


export const getServices = async (req, res, next) => {
  try {
    const { country } = req.params;

    // Fetch only required fields and use lean() for performance
    const services = await NotaryServicePricing.find(
      { [`BigPricingMaps.${country}`]: { $exists: true } },
      { serviceId: 1, [`BigPricingMaps.${country}`]: 1 }
    )
      .populate("serviceId", "ServiceNameEnglish")
      .lean();

    if (!services.length) {
      return res.status(404).json({ message: "No services found for this country" });
    }

    const formattedServices = services.map(({ serviceId, BigPricingMaps }) => {
      const [price, currency] = BigPricingMaps[country];
      return {
        serviceName: serviceId.ServiceNameEnglish,
        price,
        currency,
      };
    });

    res.status(200).json(formattedServices);
  } catch (error) {
    next(error);
  }
};

