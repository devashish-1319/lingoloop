import mongoose from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "impersonation", "other"];

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reported: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  },
  { timestamps: true }
);

reportSchema.index({ reported: 1, status: 1 });
reportSchema.index({ reporter: 1, reported: 1 });

export default mongoose.model("Report", reportSchema);
