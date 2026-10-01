import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Report from "../models/Report.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "./realtime.service.js";
import { isFriend } from "./friend.service.js";

const between = (a, b) => ({
  $or: [
    { sender: a, recipient: b },
    { sender: b, recipient: a },
  ],
});

// removes the friendship on both sides plus any request documents, so it can be started fresh later
async function severFriendship(myId, otherId) {
  await Promise.all([
    User.updateOne({ _id: myId }, { $pull: { friends: otherId } }),
    User.updateOne({ _id: otherId }, { $pull: { friends: myId } }),
    FriendRequest.deleteMany(between(myId, otherId)),
  ]);
  emitToUser(otherId, "friend-removed", { userId: myId });
}

async function getOtherUser(me, otherId) {
  if (me.id === otherId) throw new ApiError(400, "You can't do that to yourself");
  const other = await User.findById(otherId).select("_id");
  if (!other) throw new ApiError(404, "User not found");
  return other;
}

export async function unfriend(me, otherId) {
  if (!isFriend(me, otherId)) throw new ApiError(404, "You are not friends with this user");
  await severFriendship(me.id, otherId);
}

export async function blockUser(me, otherId) {
  await getOtherUser(me, otherId);
  await User.updateOne({ _id: me._id }, { $addToSet: { blocked: otherId } });
  await severFriendship(me.id, otherId);
}

export async function unblockUser(me, otherId) {
  await User.updateOne({ _id: me._id }, { $pull: { blocked: otherId } });
}

export async function getBlockedUsers(me) {
  const user = await User.findById(me._id).select("blocked").populate("blocked", "fullName profilePic");
  return user.blocked;
}

export async function reportUser(me, targetId, { reason, details }) {
  await getOtherUser(me, targetId);

  const existing = await Report.exists({ reporter: me._id, reported: targetId, status: "open" });
  if (existing) throw new ApiError(400, "You have already reported this user");

  return Report.create({ reporter: me._id, reported: targetId, reason, details: details ?? "" });
}

export const validObjectId = (id) => mongoose.isValidObjectId(id);
