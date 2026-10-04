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

// Stream tokens are HS256 JWTs signed with the API secret.
// Note: the `call_cids` claim is NOT enforced by Stream's video API (verified live), so call access is
// controlled with a dedicated call type instead - see ensureFriendCallType().
const signToken = (claims, options = {}) =>
  jwt.sign(claims, env.STREAM_API_SECRET, { algorithm: "HS256", ...options });

export const generateStreamToken = (userId) =>
  signToken({ user_id: userId.toString() }, { expiresIn: "1h" });

// ---- video calls -------------------------------------------------------------------------------
// Calls use a custom call type where only `call_member`s may read/join and plain users may not create calls.
// The server creates each call with exactly the two friends as members, so nobody else can get in,
// even with a valid Stream token.
export const FRIEND_CALL_TYPE = "friend_call";

const FRIEND_CALL_GRANTS = {
  user: [],
  call_member: [
    "join-call",
    "read-call",
    "send-audio",
    "send-video",
    "screenshare",
    "send-event",
    "end-call",
    "create-call-reaction",
  ],
};

async function videoApi(method, path, body) {
  const url = `https://video.stream-io-api.com/video${path}?api_key=${env.STREAM_API_KEY}`;
  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: signToken({ server: true }),
      "stream-auth-type": "jwt",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

let callTypeReady;
// creates the call type once per process (it persists in Stream, so this is a no-op after the first run)
function ensureFriendCallType() {
  callTypeReady ??= (async () => {
    const existing = await videoApi("GET", `/calltypes/${FRIEND_CALL_TYPE}`);
    if (existing.ok) return;

    const created = await videoApi("POST", "/calltypes", {
      name: FRIEND_CALL_TYPE,
      grants: FRIEND_CALL_GRANTS,
    });
    if (!created.ok && !/already exists/i.test(created.text)) {
      throw new Error(`Could not create Stream call type: ${created.status} ${created.text}`);
    }
  })().catch((error) => {
    callTypeReady = undefined; // retry on the next call
    throw error;
  });
  return callTypeReady;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createFriendCall(callId, memberIds, createdById) {
  await ensureFriendCallType();

  // a freshly created call type takes a moment to propagate, so retry "type does not exist"
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await videoApi("POST", `/call/${FRIEND_CALL_TYPE}/${callId}`, {
      data: { created_by_id: createdById, members: memberIds.map((user_id) => ({ user_id })) },
    });
    if (res.ok) return;
    if (res.status !== 404) throw new Error(`Stream create call failed: ${res.status} ${res.text}`);
    await sleep(1000);
  }
  throw new Error("Stream call type did not become available in time");
}

// best effort: used when a friendship ends so the former friends can no longer join an existing call
export async function revokeCallAccess(callId, memberIds) {
  try {
    await videoApi("POST", `/call/${FRIEND_CALL_TYPE}/${callId}/members`, { remove_members: memberIds });
  } catch (error) {
    logger.warn({ err: error, callId }, "Could not revoke call access");
  }
}

// Creates the 1:1 channel server-side so only verified friends can ever be members.
export const createDirectChannel = async (channelId, memberIds, createdById) => {
  const channel = streamClient.channel("messaging", channelId, {
    members: memberIds,
    created_by_id: createdById,
  });
  await channel.create();
  return channel;
};
