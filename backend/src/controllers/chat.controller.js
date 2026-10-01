import User from "../models/User.js";
import { assertCallParticipant, assertFriend, buildChannelId } from "../services/call.service.js";
import { emitToUser } from "../services/realtime.service.js";
import {
  createDirectChannel,
  generateCallToken,
  generateStreamToken,
  upsertStreamUser,
} from "../lib/stream.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStreamToken = asyncHandler(async (req, res) => {
  res.status(200).json({ token: generateStreamToken(req.user.id) });
});

export const createChannel = asyncHandler(async (req, res) => {
  const myId = req.user.id;
  const friendId = req.params.id;
  assertFriend(req.user, friendId);

  const friend = await User.findById(friendId).select("fullName profilePic");
  if (!friend) throw new ApiError(404, "User not found");

  // self-heal: make sure both users exist in Stream (a signup/onboarding sync may have failed)
  try {
    await Promise.all([upsertStreamUser(req.user), upsertStreamUser(friend)]);
  } catch (error) {
    logger.error({ err: error }, "Error syncing users to Stream");
    throw new ApiError(502, "Chat service unavailable, please try again");
  }

  const channelId = buildChannelId(myId, friendId);
  await createDirectChannel(channelId, [myId, friendId], myId);

  res.status(200).json({ channelId });
});

export const getCallToken = asyncHandler(async (req, res) => {
  const { callId } = req.params;
  assertCallParticipant(req.user, callId);

  res.status(200).json({ token: generateCallToken(req.user.id, callId) });
});

// rings a friend who currently has the app open (delivered over the SSE connection)
export const ringFriend = asyncHandler(async (req, res) => {
  const friendId = req.params.id;
  assertFriend(req.user, friendId);

  const callId = buildChannelId(req.user.id, friendId);
  const delivered = emitToUser(friendId, "incoming-call", {
    callId,
    from: { _id: req.user.id, fullName: req.user.fullName, profilePic: req.user.profilePic },
  });

  res.status(200).json({ callId, delivered });
});
