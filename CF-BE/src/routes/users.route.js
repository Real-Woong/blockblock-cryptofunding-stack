import { Router } from "express";
import * as UsersController from "../controllers/users.controller.js";

const router = Router();

// GET /api/users/:walletAddress/stats
router.get("/:walletAddress/stats", UsersController.stats);

// GET /api/users/:walletAddress/projects?type=created|funded
router.get("/:walletAddress/projects", UsersController.projects);

// GET /api/users/:walletAddress/transactions
router.get("/:walletAddress/transactions", UsersController.transactions);

// GET /api/users/:walletAddress/profiles
router.get("/:walletAddress/profile", UsersController.getProfile);

// PATCH /api/users/:walletAddress/profile
router.patch("/:walletAddress/profile", UsersController.updateProfile);

export default router;