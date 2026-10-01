import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { env, isProduction } from "./config/env.js";
import { logger } from "./lib/logger.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import eventsRoutes from "./routes/events.route.js";
import aiRoutes from "./routes/ai.route.js";
import practiceRoutes from "./routes/practice.route.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();

// behind a reverse proxy (Render, Heroku, ...) so rate limiting sees the real client IP
if (isProduction) app.set("trust proxy", 1);

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
// Helmet's default CSP would block avatars, flags and the Stream chat/video connections, so allow those explicitly
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        mediaSrc: ["'self'", "blob:", "https:"],
        fontSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
      },
    },
  })
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // allow frontend to send cookies
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp });
});

// brute-force protection on credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { message: "Too many attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// AI calls cost money: cap them per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { message: "AI request limit reached, please try again later" },
});
app.use("/api/ai", aiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api", notFound);

if (isProduction) {
  const dist = path.resolve(import.meta.dirname, "../../frontend/dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use(errorHandler);

export default app;
