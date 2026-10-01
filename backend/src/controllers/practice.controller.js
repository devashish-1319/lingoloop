import mongoose from "mongoose";
import * as practice from "../services/practice.service.js";
import { assertCallParticipant } from "../services/call.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const startSession = asyncHandler(async (req, res) => {
  const { callId } = req.body;
  if (typeof callId !== "string") throw new ApiError(400, "All fields are required");

  const partnerId = assertCallParticipant(req.user, callId);
  const session = await practice.startSession(req.user, callId, partnerId);
  res.status(201).json({ sessionId: session._id });
});

export const endSession = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid session id");
  const session = await practice.endSession(req.user, req.params.id);
  res.status(200).json({ durationSec: session.durationSec });
});

export const getStats = asyncHandler(async (req, res) => {
  res.status(200).json(await practice.getStats(req.user));
});
