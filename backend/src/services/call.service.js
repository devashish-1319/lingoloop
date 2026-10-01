import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isFriend } from "./friend.service.js";

// the channel / call id is the two user ids, sorted and joined: "<idA>-<idB>"
export const buildChannelId = (a, b) => [a, b].sort().join("-");

export function assertFriend(user, friendId) {
  if (!mongoose.isValidObjectId(friendId)) throw new ApiError(400, "Invalid user id");
  if (!isFriend(user, friendId)) throw new ApiError(403, "You can only chat or call your friends");
}

/** Throws unless `user` is a participant of the call and friends with the other participant. Returns the other id. */
export function assertCallParticipant(user, callId) {
  const ids = callId.split("-");
  if (ids.length !== 2 || !ids.includes(user.id) || callId !== buildChannelId(ids[0], ids[1])) {
    throw new ApiError(403, "You are not a participant of this call");
  }
  const friendId = ids.find((id) => id !== user.id);
  assertFriend(user, friendId);
  return friendId;
}
