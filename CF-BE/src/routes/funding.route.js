import { Router } from "express";
import * as FundingController from "../controllers/funding.controller.js";

const router = Router();

// /api/funding/:id
router.get("/:id", FundingController.getSummary);
router.post("/:id", FundingController.createFunding);

export default router;