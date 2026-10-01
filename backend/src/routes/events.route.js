import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { subscribe } from "../services/realtime.service.js";

const router = express.Router();

// Server-Sent Events stream: friend requests, accepted requests, incoming calls, ...
router.get("/", protectRoute, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // don't let nginx-style proxies buffer the stream
  });
  res.flushHeaders();
  res.write("retry: 5000\n\n");

  const unsubscribe = subscribe(req.user.id, res);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

export default router;
