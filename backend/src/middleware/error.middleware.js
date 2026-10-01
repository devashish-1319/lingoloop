import { ApiError } from "../utils/ApiError.js";
import { logger } from "../lib/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their 4 arguments
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: "Invalid data" });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: "Already exists" });
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, "Unhandled error");
  res.status(500).json({ message: "Internal Server Error" });
}
