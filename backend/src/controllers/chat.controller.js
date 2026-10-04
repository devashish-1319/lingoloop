import User from "../models/User.js";
import { assertCallParticipant, assertFriend, buildChannelId } from "../services/call.service.js";
import { emitToUser } from "../services/realtime.service.js";
import {
  createDirectChannel,
  createFriendCall,
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

// Makes sure the call exists on Stream with exactly the two friends as members, then returns a token.
// Only members can read or join a call of this type, so the token alone grants nothing for other calls.
export const getCallToken = asyncHandler(async (req, res) => {
  const { callId } = req.params;
  const friendId = assertCallParticipant(req.user, callId);

  try {
    await createFriendCall(callId, [req.user.id, friendId], req.user.id);
  } catch (error) {
    logger.error({ err: error }, "Error creating Stream call");
    throw new ApiError(502, "Video service unavailable, please try again");
  }

  res.status(200).json({ token: generateStreamToken(req.user.id) });
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
