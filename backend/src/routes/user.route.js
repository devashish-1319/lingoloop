import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { recommendedUsersQuerySchema } from "../validators/user.validator.js";
import { reportSchema } from "../validators/social.validator.js";
import {
  blockUser,
  getBlockedUsers,
  reportUser,
  unblockUser,
  unfriend,
} from "../controllers/social.controller.js";
import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", validate(recommendedUsersQuerySchema, "query"), getRecommendedUsers);
router.get("/friends", getMyFriends);
router.delete("/friends/:id", unfriend);

router.get("/blocked", getBlockedUsers);
router.post("/block/:id", blockUser);
router.delete("/block/:id", unblockUser);
router.post("/report/:id", validate(reportSchema), reportUser);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id", deleteFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
