import AdminUploadedDocument from "../../../../models/Admin/translationModels/adminUploadedDocument.js";
import TranslationDetails from "../../../../models/Customer/translationModel/translationDetails.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";


export const adminSubmittedDoc = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { description, documentType } = req.body;
    
    const translationCase = await TranslationCase.findOne({ _id: caseId });
    if (!translationCase) {
      return res.status(404).json({ message: "Translation case not found." });
    }

    const customer = await Customer.findById(translationCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    if (!documentType || !["pdf", "image"].includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type." });
    }

    const caseExists = await TranslationDetails.findById(caseId);
    if (!caseExists) {
      return res
        .status(404)
        .json({ message: "Invalid caseId. No case found with this ID." });
    }

    if (!req.files || req.files.length === 0 || !description) {
      return res
        .status(400)
        .json({ message: "Files and description are required." });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        const documentUrl = await uploadFileToS3(file, "adminUploadedDocs");
        uploadedFiles.push({
          documentUrl,
          documentType
        });
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        return res.status(500).json({
          message: `Error uploading file: ${file.originalname}`,
          error: uploadError.message
        });
      }
    }

    const savedDocuments = await Promise.all(
      uploadedFiles.map(doc =>
        new AdminUploadedDocument({
          caseId,
          documentUrl: doc.documentUrl,
          description,
          documentType: doc.documentType,
          uploadedAt: new Date()
        }).save()
      )
    );
   

    res.status(201).json({
      message: "Documents uploaded successfully.",
      uploadedDocuments: savedDocuments
    });
  } catch (error) {
    next(error);
  }
};
