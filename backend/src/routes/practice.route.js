import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { endSession, getStats, pingSession, startSession } from "../controllers/practice.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/stats", getStats);
router.post("/", startSession);
router.put("/:id/ping", pingSession);
router.put("/:id/end", endSession);

export default router;
