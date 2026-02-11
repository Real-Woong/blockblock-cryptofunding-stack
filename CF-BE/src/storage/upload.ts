import { Router } from "express";
import multer from "multer";
import { StorageProvider } from "../storage/types";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!ok) return cb(new Error("Only jpg/png/webp are allowed"));
    cb(null, true);
  },
});

export function uploadsRouter(storage: StorageProvider) {
  router.post("/", upload.single("file"), async (req, res) => {
    try {
      const f = req.file;
      if (!f) return res.status(400).json({ message: "No file uploaded" });

      const result = await storage.putObject({
        buffer: f.buffer,
        mimeType: f.mimetype,
        originalName: f.originalname,
      });

      return res.json({
        url: result.url,
        key: result.key,
        mimeType: result.mimeType,
        size: result.size,
      });
    } catch (e: any) {
      return res.status(400).json({ message: e?.message ?? "Upload failed" });
    }
  });

  return router;
}

// AWS용