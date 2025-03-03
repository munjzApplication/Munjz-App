import notaryServiceDetailsModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import notaryServicePayment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import notaryServiceDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import { formatDate } from "../../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getAllNotaryCases = async (req, res, next) => {
  try {
    let notaryCases = await notaryServiceDetailsModel.aggregate([
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $lookup: {
          from: "notaryservice_payments",
          localField: "_id",
          foreignField: "notaryServiceCase",
          as: "payment"
        }
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          notaryServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
          follower: 1,
          createdAt: 1,
          status: 1,
          customerName: "$customer.Name",
          customerEmail: "$customer.email",
          customerPhone: "$customer.phoneNumber",
          customerProfile: "$customer.profilePhoto",
          paymentAmount: "$payment.amount",
          paymentCurrency: "$payment.paidCurrency"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    notaryCases = notaryCases.map(notaryCase => ({
      ...notaryCase,
      createdAt: formatDate(notaryCase.createdAt)
    }));

    res.status(200).json({
      message: "Notary cases fetched successfully",
      notaryCases
    });
  } catch (error) {
    next(error);
  }
};


export const getNotaryCaseById = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    // Fetch court case by ID
    const notarycase = await notaryServiceDetailsModel.findById(caseId);
    if (!notarycase) {
      return res.status(404).json({ message: "Notary case not found" });
    }

    // Fetch associated court case document
    const notarycaseDoc = await notaryServiceDocument.findOne({ notaryServiceCase: caseId });
    console.log("notarycaseDoc", notarycaseDoc);

    // Format the court case
    const formattedCase = {
      ...notarycaseDoc.toObject(),
      createdAt: formatDate(notarycaseDoc.createdAt)
    };

    res.status(200).json({
      message: "Notary case fetched successfully",
      notarycase: formattedCase,
      
    });
  } catch (error) {
    next(error);
  }
};


export const getCaseDocs = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    // Fetch documents where courtServiceCase matches the provided caseId
    const getdocs = await notaryServiceDocument.findOne({ notaryServiceCase: caseId });

    if (!getdocs || !getdocs.Documents) {
      return res.status(404).json({ message: "No documents found for this case" });
    }

    return res.status(200).json({message : "Documents retrieved successfully", Documents: getdocs.Documents });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};