import { z } from "zod";
import { REPORT_REASONS } from "../models/Report.js";

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: "Invalid report reason" }),
  details: z.string().trim().max(1000).optional(),
});
