
import express from "express";
import { addFavoriteConsultant, getFavoriteConsultants } from "../../../../controllers/Customer/services/consultation/favController.js";

const router = express.Router();

router.post("/add-favorite", addFavoriteConsultant); 
router.get("/get-favorites", getFavoriteConsultants); 

export default router;
