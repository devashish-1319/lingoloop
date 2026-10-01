import { createElement } from "react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { BASE_URL } from "../lib/axios";
import useAuthUser from "./useAuthUser";
import IncomingCallToast from "../components/IncomingCallToast";

// Subscribes to the server's Server-Sent-Events stream and turns events into cache updates and toasts.
const useRealtime = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authUserId = authUser?._id;

  useEffect(() => {
    if (!authUserId) return;

    // cookies are sent with withCredentials; EventSource reconnects by itself if the connection drops
    const source = new EventSource(`${BASE_URL}/events`, { withCredentials: true });

    const listen = (name, handler) =>
      source.addEventListener(name, (e) => handler(JSON.parse(e.data)));

    listen("friend-request", ({ from }) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast(`${from.fullName} sent you a friend request`, { icon: "👋" });
    });

    listen("friend-accepted", ({ by }) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      toast.success(`${by.fullName} is now your friend`);
    });

    listen("friend-removed", () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    });

    listen("incoming-call", ({ callId, from }) => {
      toast.custom(
        (t) =>
          createElement(IncomingCallToast, {
            toast: t,
            from,
            onJoin: () => {
              toast.dismiss(t.id);
              navigate(`/call/${callId}`);
            },
            onDecline: () => toast.dismiss(t.id),
          }),
        { id: `call-${callId}`, duration: 30000 }
      );
    });

    return () => source.close();
  }, [authUserId, queryClient, navigate]);
};

export default useRealtime;
