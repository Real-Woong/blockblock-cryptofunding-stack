// express 미들웨이 / 라우터

import express from "express";
import cors from "cors";
import morgan from "morgan";

import apiRouter from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
    const app = express();
    // Trust reverse proxy (ALB / Nginx) for correct protocol/host
    app.set("trust proxy", 1);

    // 기본 middleware
    app.use(cors({ origin: true, credentials: true}));
    app.use(express.json({ limit: "1mb" }));
    app.use(morgan("dev"));
    // Serve uploaded files (local dev & before S3 migration)
    app.use("/uploads", express.static(process.cwd() + "/uploads"));

    // (선택) 루트 확인용
    app.get("/", (req, res) => {
        res.send("Backend is running 달리는중")
    });

    // API rotuer
    app.use("/api", apiRouter);

    // error 핸들러
    app.use((err, req, res, next) => {
        console.error("🔥 API Error:", err);          // 에러 객체
        console.error(err?.stack || err);            // 스택 트레이스
        res.status(err?.status || 500).json({
            message: err?.message || "Internal Server Error",
        });
    });
    return app;
}