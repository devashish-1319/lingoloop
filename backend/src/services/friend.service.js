import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "./realtime.service.js";

const PUBLIC_USER_FIELDS = "fullName profilePic nativeLanguage learningLanguage";

// Adds each user to the other's friends array, then marks the request accepted.
// $addToSet is idempotent and the status is updated last, so a failed attempt can simply be retried.
async function makeFriends(friendRequest) {
  await Promise.all([
    User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    }),
    User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    }),
  ]);

  friendRequest.status = "accepted";
  await friendRequest.save();
}

export const isFriend = (user, otherId) => user.friends.some((id) => id.toString() === otherId);

/**
 * Onboarded users that are not me or my friends, best language match first:
 * they speak what I'm learning (+2), they are learning what I speak (+1).
 */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getRecommendedUsers(me, { page, limit, language, learning, location, search }) {
  const match = {
    _id: { $ne: me._id, $nin: [...me.friends, ...me.blocked] },
    blocked: { $ne: me._id }, // hide people who blocked me
    isOnboarded: true,
  };
  const ci = (text) => ({ $regex: `^${escapeRegex(text)}$`, $options: "i" });
  if (language) match.nativeLanguage = ci(language);
  if (learning) match.learningLanguage = ci(learning);
  if (location) match.location = { $regex: escapeRegex(location), $options: "i" };
  if (search) match.fullName = { $regex: escapeRegex(search), $options: "i" };

  const lower = (value) => ({ $toLower: value });
  const [result] = await User.aggregate([
    { $match: match },
    {
      $addFields: {
        score: {
          $add: [
            { $cond: [{ $eq: [lower("$nativeLanguage"), me.learningLanguage.toLowerCase()] }, 2, 0] },
            { $cond: [{ $eq: [lower("$learningLanguage"), me.nativeLanguage.toLowerCase()] }, 1, 0] },
          ],
        },
      },
    },
    { $sort: { score: -1, _id: -1 } },
    {
      $facet: {
        users: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              fullName: 1,
              profilePic: 1,
              bio: 1,
              nativeLanguage: 1,
              learningLanguage: 1,
              location: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const total = result.total[0]?.count ?? 0;
  return { users: result.users, page, total, totalPages: Math.ceil(total / limit) };
}

export async function getFriends(me) {
  const user = await User.findById(me._id).select("friends").populate("friends", PUBLIC_USER_FIELDS);
  return user.friends;
}

/** Returns { request, accepted }: accepted is true when it completed a request they had sent me. */
export async function sendFriendRequest(me, recipientId) {
  const myId = me.id;

  if (myId === recipientId) {
    throw new ApiError(400, "You can't send friend request to yourself");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) throw new ApiError(404, "Recipient not found");

  if (me.blocked.some((id) => id.toString() === recipientId)) {
    throw new ApiError(400, "Unblock this user first");
  }
  if (recipient.blocked.some((id) => id.toString() === myId)) {
    throw new ApiError(403, "You can't send a friend request to this user");
  }

  if (isFriend(recipient, myId)) {
    throw new ApiError(400, "You are already friends with this user");
  }

  const existing = await FriendRequest.findOne({
    $or: [
      { sender: myId, recipient: recipientId },
      { sender: recipientId, recipient: myId },
    ],
  });

  if (existing) {
    // they already asked me: sending a request back is the same as accepting theirs
    if (existing.status === "pending" && existing.recipient.toString() === myId) {
      await makeFriends(existing);
      emitToUser(recipientId, "friend-accepted", { by: { _id: myId, fullName: me.fullName } });
      return { request: existing, accepted: true };
    }
    throw new ApiError(400, "A friend request already exists between you and this user");
  }

  const request = await FriendRequest.create({ sender: myId, recipient: recipientId });
  emitToUser(recipientId, "friend-request", { from: { _id: myId, fullName: me.fullName } });
  return { request, accepted: false };
}

export async function acceptFriendRequest(me, requestId) {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Friend request not found");

  if (request.recipient.toString() !== me.id) {
    throw new ApiError(403, "You are not authorized to accept this request");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Friend request already handled");
  }

  await makeFriends(request);
  emitToUser(request.sender, "friend-accepted", { by: { _id: me.id, fullName: me.fullName } });
}

// recipient declines or sender cancels; the request is deleted so it can be sent again later
export async function deleteFriendRequest(me, requestId) {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Friend request not found");

  const isParticipant =
    request.sender.toString() === me.id || request.recipient.toString() === me.id;
  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to modify this request");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Friend request already handled");
  }

  await request.deleteOne();
}

export async function getFriendRequests(me) {
  const [incomingReqs, acceptedReqs] = await Promise.all([
    FriendRequest.find({ recipient: me.id, status: "pending" }).populate("sender", PUBLIC_USER_FIELDS),
    FriendRequest.find({ sender: me.id, status: "accepted" }).populate("recipient", "fullName profilePic"),
  ]);
  return { incomingReqs, acceptedReqs };
}

export function getOutgoingFriendReqs(me) {
  return FriendRequest.find({ sender: me.id, status: "pending" }).populate(
    "recipient",
    PUBLIC_USER_FIELDS
  );
}
