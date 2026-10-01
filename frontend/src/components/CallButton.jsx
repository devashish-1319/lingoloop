import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall, children }) {
  return (
    <div className="p-3 border-b flex items-center justify-end gap-2 max-w-7xl mx-auto w-full absolute top-0">
      {children}
      <button
        onClick={handleVideoCall}
        className="btn btn-success btn-sm text-white"
        aria-label="Start video call"
      >
        <VideoIcon className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

export default CallButton;
