import { HttpError } from "../utils/httpError.js";

export function errorMiddleware(err, req, res, next) {
  const isHttp = err instanceof HttpError;

  const status = isHttp ? err.statusCode : 500;
  const message = isHttp ? err.message : "Internal Server Error";

  const payload = { ok: false, message };

  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv !== "production") {
    payload.debug = { name: err?.name, stack: err?.stack };
  }

  res.status(status).json(payload);
}
