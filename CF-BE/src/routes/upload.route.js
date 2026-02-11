import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
// Optional: override the public base URL used in returned file URLs (e.g. https://api.example.com)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;

export const uploadsRouter = Router();

// ✅ 업로드 저장 폴더(백엔드 루트/uploads)
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

uploadsRouter.post("/", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large", maxBytes: 10 * 1024 * 1024 });
    }
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    // ✅ 프론트가 필요로 하는 URL 생성
    // - 로컬에서는 req.protocol/host가 정상
    // - ALB/Nginx 같은 프록시 뒤에서는 X-Forwarded-* 헤더를 참고해야 https/도메인이 맞게 잡힘
    // - 운영에선 PUBLIC_BASE_URL을 설정해 가장 확실하게 고정 가능
    const forwardedProto = (req.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim();
    const forwardedHost = (req.headers["x-forwarded-host"] || "").toString().split(",")[0].trim();

    const protocol = PUBLIC_BASE_URL
      ? new URL(PUBLIC_BASE_URL).protocol.replace(":", "")
      : (forwardedProto || req.protocol);

    const host = PUBLIC_BASE_URL
      ? new URL(PUBLIC_BASE_URL).host
      : (forwardedHost || req.get("host"));

    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    const pathName = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: "File uploaded successfully",
      url,
      path: pathName,
      storedName: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  });
});