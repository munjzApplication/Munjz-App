import express from "express";
import { consultationDuration ,getDuration} from "../../../controllers/Consultant/consultantationDuration.js";

const router = express.Router();

router.post("/consultation-duration", consultationDuration );
router.get("/get-duration",getDuration)

export default router;
