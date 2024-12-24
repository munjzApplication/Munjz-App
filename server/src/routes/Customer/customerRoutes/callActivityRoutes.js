import express from "express";
import { createCallActivity } from "../../../controllers/Customer/customerController/callActivityController.js";

const router = express.Router();

router.post("/activity", createCallActivity);

export default router;
