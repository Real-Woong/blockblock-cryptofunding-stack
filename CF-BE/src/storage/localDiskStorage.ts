import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider, PutObjectResult } from "./types";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function extFromMime(mime: string) {
  // 최소한만 매핑 (필요시 확장)
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return "";
}

export class LocalDiskStorage implements StorageProvider {
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor(params: { uploadDir?: string; publicBaseUrl: string }) {
    this.uploadDir = params.uploadDir ?? path.join(process.cwd(), "uploads");
    this.publicBaseUrl = params.publicBaseUrl; // 예: http://localhost:4000
    ensureDir(this.uploadDir);
  }

  async putObject(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
  }): Promise<PutObjectResult> {
    const ext = extFromMime(params.mimeType) || path.extname(params.originalName) || "";
    const fileName = `${crypto.randomUUID()}${ext}`;
    const absPath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(absPath, params.buffer);

    return {
      url: `${this.publicBaseUrl}/uploads/${fileName}`,
      key: fileName,
      mimeType: params.mimeType,
      size: params.buffer.length,
    };
  }
}