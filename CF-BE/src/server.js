// src/server.js
// ================================
// Express 서버 엔트리포인트
// ================================
// 담당 역할:
// 1) Express 앱 생성 및 기본 설정
// 2) 전역 미들웨어 적용 (CORS, 로깅, 바디 파싱)
// 3) /api 하위로 API 라우터 마운트
// 4) 업로드 파일 정적 서빙(/uploads)
// 5) 지정 포트에서 HTTP 서버 실행

// --- 핵심 프레임워크 & 미들웨어 ---
import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config"

// --- Express Router (API 조립) ---
import { Router } from "express";

// --- API 라우트 모듈 ---
import healthRoute from "./routes/health.route.js";
import usersRoute from "./routes/users.route.js";
import projectsRoute from "./routes/projects.route.js";
import fundingRoute from "./routes/funding.route.js"

// --- Node.js 유틸 (ESM __dirname 지원) ---
import path from "path";
import { fileURLToPath } from "url";

// --- 파일 업로드 라우트 (multer) ---
import { uploadsRouter } from "./routes/upload.route.js";

// ================================
// API 라우터 구성
// ================================
const apiRouter = Router();

// ESM 환경에서 __dirname 대체 값 계산 (정적 파일 경로 계산에 사용)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 핵심 도메인 API
apiRouter.use("/users", usersRoute);
apiRouter.use("/projects", projectsRoute);
apiRouter.use("/funding", fundingRoute)

// 업로드 API (POST /api/uploads)
apiRouter.use("/uploads", uploadsRouter); // POST /api/uploads

// --- Express 앱 생성 ---
const app = express();

// ================================
// Express 앱 & 전역 미들웨어
// ================================
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================================
// 정적 파일 서빙
// ================================
// 업로드된 파일을 프론트에서 URL로 접근할 수 있도록 공개
// 예) http://localhost:4000/uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check (GET /health)
app.use("/health", healthRoute);

// 모든 API 라우트를 /api 하위로 마운트
app.use("/api", apiRouter);

// 루트 엔드포인트 (서버 구동 확인용)
app.get("/", (_req, res) => res.status(200).send("OK"));

// ================================
// 서버 실행
// ================================
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

export default app;