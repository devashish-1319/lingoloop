import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { suggestTopics, translate } from "../controllers/ai.controller.js";
import { topicsSchema, translateSchema } from "../validators/ai.validator.js";

const router = express.Router();

router.use(protectRoute);

router.post("/translate", validate(translateSchema), translate);
router.post("/topics", validate(topicsSchema), suggestTopics);

export default router;
