import { PhoneIcon, PhoneOffIcon } from "lucide-react";
import Avatar from "./Avatar";

const IncomingCallToast = ({ toast, from, onJoin, onDecline }) => (
  <div
    role="alert"
    className={`card bg-base-200 shadow-xl border border-primary/30 w-80 ${
      toast.visible ? "animate-enter" : "animate-leave"
    }`}
  >
    <div className="card-body p-4 flex-row items-center gap-3">
      <div className="avatar">
        <div className="w-12 rounded-full">
          <Avatar src={from.profilePic} name={from.fullName} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{from.fullName}</p>
        <p className="text-xs opacity-70">Incoming video call</p>
      </div>
      <button className="btn btn-error btn-circle btn-sm" onClick={onDecline} aria-label="Decline call">
        <PhoneOffIcon className="size-4" />
      </button>
      <button className="btn btn-success btn-circle btn-sm" onClick={onJoin} aria-label="Answer call">
        <PhoneIcon className="size-4" />
      </button>
    </div>
  </div>
);

export default IncomingCallToast;
