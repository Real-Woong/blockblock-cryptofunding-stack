// api 라우터 모음

import { Router } from "express";
import { uploadsRouter } from "./uploads.route.js";
import { LocalDiskStorage } from "../storage/localDiskStorage.js";

import healthRoute from "./health.route.js";
import projectRoute from "./projects.route.js";
import userRoute from "./users.route.js";
import fundingRoute from "./funding.route.js";

const router = Router();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`;
const storage = new LocalDiskStorage({ publicBaseUrl });

router.use("/uploads", uploadsRouter(storage)); // POST /api/uploads
router.use(healthRoute);
router.use("/projects", projectRoute);
router.use("/users", userRoute);
router.use("/funding", fundingRoute);

export default router;
