
import express from "express";
import { addFavoriteConsultant, getFavoriteConsultants } from "../../../../controllers/Customer/services/consultation/favController.js";

const router = express.Router();

router.post("/favorites", addFavoriteConsultant); 
router.get("/favorites/:customerId", getFavoriteConsultants); 

export default router;
