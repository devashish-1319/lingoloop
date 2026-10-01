import express from "express";
import { changePassword, login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  onboardingSchema,
  signupSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, validate(onboardingSchema), onboard);

// edit profile after onboarding (same fields and validation)
router.put("/profile", protectRoute, validate(onboardingSchema), onboard);
router.put("/password", protectRoute, validate(changePasswordSchema), changePassword);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
