import * as social from "../services/social.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const idParam = (req) => {
  if (!social.validObjectId(req.params.id)) throw new ApiError(400, "Invalid user id");
  return req.params.id;
};

export const unfriend = asyncHandler(async (req, res) => {
  await social.unfriend(req.user, idParam(req));
  res.status(200).json({ message: "Friend removed" });
});

export const blockUser = asyncHandler(async (req, res) => {
  await social.blockUser(req.user, idParam(req));
  res.status(200).json({ message: "User blocked" });
});

export const unblockUser = asyncHandler(async (req, res) => {
  await social.unblockUser(req.user, idParam(req));
  res.status(200).json({ message: "User unblocked" });
});

export const getBlockedUsers = asyncHandler(async (req, res) => {
  res.status(200).json(await social.getBlockedUsers(req.user));
});

export const reportUser = asyncHandler(async (req, res) => {
  await social.reportUser(req.user, idParam(req), req.body);
  res.status(201).json({ message: "Report submitted. Thank you." });
});
