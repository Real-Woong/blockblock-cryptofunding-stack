import { Router } from "express";
import * as ProjectsController from "../controllers/projects.controller.js";
import auth from "../middlewares/auth.js";

const router = Router();

function injectWalletHeaderFromBody(req, _res, next) {
  // FE가 보내는 값
  let wa = req.body?.creatorWalletAddress;

  // 이미 헤더가 있으면 그대로 둠 (Bearer/헤더 우선)
  if (req.headers["x-wallet-address"]) {
        return next();  
    }

  if (wa != null) {
    wa = String(wa).trim();

        // If someone accidentally passed a hex string without 0x, prefix it.
        if (wa && !wa.startsWith("0x") && /^[0-9a-fA-F]+$/.test(wa)) {
        wa = `0x${wa}`;
        }

        if (wa) {
        req.headers["x-wallet-address"] = wa;
        }
    }
    
  console.log("[create] creatorWalletAddress:", req.body?.creatorWalletAddress);
  next();
}

// List projects (Explore)
router.get("/", ProjectsController.list);

// Get project by id (ProjectDetail)
router.get("/:id", ProjectsController.getById);

//---- 권한 구분

// Create project (StartProjectWizard)
router.post("/", injectWalletHeaderFromBody, auth, ProjectsController.create);

// Update project
router.patch("/:id", auth, ProjectsController.update);

// Delete project
router.delete("/:id", auth, ProjectsController.remove);

// Access (creator/viewer role)
router.get("/:id/access", auth, ProjectsController.access);

export default router;