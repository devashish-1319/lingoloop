import mongoose from "mongoose";

// one record per participant per video call
const practiceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ user: 1, endedAt: -1 });

export default mongoose.model("PracticeSession", practiceSessionSchema);
