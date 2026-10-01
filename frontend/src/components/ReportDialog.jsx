import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { reportUser } from "../lib/api";
import { getErrorMessage } from "../lib/utils";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Something else" },
];

const ReportDialog = ({ user, onClose }) => {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: reportUser,
    onSuccess: () => {
      toast.success("Report submitted. Thank you.");
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not submit report")),
  });

  return (
    <dialog className="modal modal-open" aria-labelledby="report-title" onCancel={onClose}>
      <form
        className="modal-box space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutate({ userId: user._id, reason, details });
        }}
      >
        <h3 id="report-title" className="font-bold text-lg">
          Report {user.fullName}
        </h3>

        <label className="form-control">
          <span className="label-text mb-1">Reason</span>
          <select
            className="select select-bordered"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Details (optional)</span>
          <textarea
            className="textarea textarea-bordered h-24"
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </label>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-error" disabled={isPending}>
            Submit report
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default ReportDialog;
