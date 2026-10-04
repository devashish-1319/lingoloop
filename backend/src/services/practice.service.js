import PracticeSession from "../models/PracticeSession.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_SESSION_SEC = 4 * 60 * 60; // guards against a session that was never closed
const ABANDONED_AFTER_MS = 90 * 1000; // no heartbeat for this long = the tab was closed / the browser crashed

export function startSession(me, callId, partnerId) {
  return PracticeSession.create({ user: me._id, partner: partnerId, callId });
}

// heartbeat from the call page; lets us close the session at the last known moment if the tab is killed
export async function pingSession(me, sessionId) {
  const session = await PracticeSession.findOneAndUpdate(
    { _id: sessionId, user: me._id, endedAt: { $exists: false } },
    { lastSeenAt: new Date() }
  );
  if (!session) throw new ApiError(404, "Session not found");
}

// sessions whose heartbeat stopped are ended at their last heartbeat
async function closeAbandonedSessions(userId) {
  await PracticeSession.updateMany(
    {
      user: userId,
      endedAt: { $exists: false },
      lastSeenAt: { $lt: new Date(Date.now() - ABANDONED_AFTER_MS) },
    },
    [
      {
        $set: {
          endedAt: "$lastSeenAt",
          durationSec: {
            $min: [
              MAX_SESSION_SEC,
              { $round: [{ $divide: [{ $subtract: ["$lastSeenAt", "$startedAt"] }, 1000] }, 0] },
            ],
          },
        },
      },
    ]
  );
}

export async function endSession(me, sessionId) {
  const session = await PracticeSession.findOne({ _id: sessionId, user: me._id });
  if (!session) throw new ApiError(404, "Session not found");
  if (session.endedAt) return session; // already closed: idempotent

  session.endedAt = new Date();
  session.durationSec = Math.min(
    Math.round((session.endedAt - session.startedAt) / 1000),
    MAX_SESSION_SEC
  );
  await session.save();
  return session;
}

const dayKey = (date) => date.toISOString().slice(0, 10); // UTC day

export async function getStats(me) {
  await closeAbandonedSessions(me._id);
  const sessions = await PracticeSession.find({ user: me._id, endedAt: { $exists: true } })
    .sort({ endedAt: -1 })
    .populate("partner", "fullName profilePic");

  const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);

  // minutes per day for the last 7 days (oldest first)
  const perDay = new Map();
  for (let i = 6; i >= 0; i--) {
    perDay.set(dayKey(new Date(Date.now() - i * 86400000)), 0);
  }
  const practiceDays = new Set();
  for (const s of sessions) {
    const key = dayKey(s.endedAt);
    practiceDays.add(key);
    if (perDay.has(key)) perDay.set(key, perDay.get(key) + s.durationSec);
  }

  // streak = consecutive days with practice, counting back from today (or yesterday)
  let streak = 0;
  const cursor = new Date();
  if (!practiceDays.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (practiceDays.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const partners = new Map();
  for (const s of sessions) {
    if (!s.partner) continue;
    const id = s.partner._id.toString();
    const entry = partners.get(id) ?? { partner: s.partner, sessions: 0, totalSec: 0 };
    entry.sessions++;
    entry.totalSec += s.durationSec;
    partners.set(id, entry);
  }

  return {
    totalMinutes: Math.round(totalSec / 60),
    totalSessions: sessions.length,
    streakDays: streak,
    last7Days: [...perDay].map(([date, sec]) => ({ date, minutes: Math.round(sec / 60) })),
    topPartners: [...partners.values()].sort((a, b) => b.totalSec - a.totalSec).slice(0, 3),
    recent: sessions.slice(0, 10),
  };
}
