
import express from "express";
import { updateFavoriteConsultant, getFavoriteConsultants } from "../../../../controllers/Customer/services/consultation/favController.js";

const router = express.Router();

router.post("/add-remove", updateFavoriteConsultant); 
router.get("/get-favorites", getFavoriteConsultants); 

export default router;
