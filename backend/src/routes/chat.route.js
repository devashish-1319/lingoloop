import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createChannel, getCallToken, getStreamToken, ringFriend } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/channel/:id", protectRoute, createChannel);
router.get("/call-token/:callId", protectRoute, getCallToken);
router.post("/call/:id/ring", protectRoute, ringFriend);

export default router;
