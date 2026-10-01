import mongoose from "mongoose";
import * as friendService from "../services/friend.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function validId(id, label = "id") {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`);
  return id;
}

export const getRecommendedUsers = asyncHandler(async (req, res) => {
  res.status(200).json(await friendService.getRecommendedUsers(req.user, req.query));
});

export const getMyFriends = asyncHandler(async (req, res) => {
  res.status(200).json(await friendService.getFriends(req.user));
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const { request, accepted } = await friendService.sendFriendRequest(
    req.user,
    validId(req.params.id, "user id")
  );
  if (accepted) return res.status(200).json({ message: "Friend request accepted" });
  res.status(201).json(request);
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  await friendService.acceptFriendRequest(req.user, validId(req.params.id, "request id"));
  res.status(200).json({ message: "Friend request accepted" });
});

export const deleteFriendRequest = asyncHandler(async (req, res) => {
  await friendService.deleteFriendRequest(req.user, validId(req.params.id, "request id"));
  res.status(200).json({ message: "Friend request removed" });
});

export const getFriendRequests = asyncHandler(async (req, res) => {
  res.status(200).json(await friendService.getFriendRequests(req.user));
});

export const getOutgoingFriendReqs = asyncHandler(async (req, res) => {
  res.status(200).json(await friendService.getOutgoingFriendReqs(req.user));
});
