import CourtCase from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import Translation from "../../../models/Customer/translationModel/translationDetails.js";
import Consultation from "../../../models/Customer/consultationModel/consultationModel.js";



export const getCustomerServices = async (req, res) => {
    
    const { customerId, category, page = 1, limit = 10 } = req.body;
  
    try {
      let services = [];
  
      if (category === "notaryservice") {
        services = await NotaryCase.find({ customerId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
      } else if (category === "courtservice") {
        services = await CourtCase.find({ customerId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
      } else if (category === "translation") {
        services = await Translation.find({ customerId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
      } else if (category === "consultation") {
        services = await Consultation.find({ customerId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
      } else {
        // Fetch all categories in parallel using Promise.all()
        const [notary, court, translation, consultation] = await Promise.all([
            NotaryCase.find({ customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
            CourtCase.find({ customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
            Translation.find({ customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
            Consultation.find({ customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
        ]);
  
        services = [...notary, ...court, ...translation, ...consultation];
      }
  
      res.status(200).json({ message:"Successfully fetched Datas" ,services });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
  