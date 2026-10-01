import { StreamChat } from "stream-chat";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const streamClient = StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET);

const toStreamUser = (user) => ({
  id: user._id.toString(),
  name: user.fullName,
  image: user.profilePic || "",
});

// throws on failure so callers can decide whether it is fatal
export const upsertStreamUser = async (user) => {
  await streamClient.upsertUsers([toStreamUser(user)]);
};

// non-fatal variant for signup/onboarding; a failed sync is repaired when the user first chats
export const trySyncStreamUser = async (user) => {
  try {
    await upsertStreamUser(user);
  } catch (error) {
    logger.warn({ err: error, userId: user._id.toString() }, "Could not sync user to Stream");
  }
};

// Stream tokens are HS256 JWTs signed with the API secret. The `call_cids` claim limits
// which video calls the token can access (an unmatched list means none).
const signStreamToken = (userId, callCids) =>
  jwt.sign({ user_id: userId.toString(), call_cids: callCids }, env.STREAM_API_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
  });

// Chat token: valid for chat only, not for joining any video call.
export const generateStreamToken = (userId) => signStreamToken(userId, ["default:none"]);

// Video token: valid only for the one call the user was authorized for.
export const generateCallToken = (userId, callId) => signStreamToken(userId, [`default:${callId}`]);

// Creates the 1:1 channel server-side so only verified friends can ever be members.
export const createDirectChannel = async (channelId, memberIds, createdById) => {
  const channel = streamClient.channel("messaging", channelId, {
    members: memberIds,
    created_by_id: createdById,
  });
  await channel.create();
  return channel;
};
