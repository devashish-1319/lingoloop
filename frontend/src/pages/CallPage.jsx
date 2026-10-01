import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { endPracticeSession, getCallToken, startPracticeSession } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();
  const authUserId = authUser?._id;

  useEffect(() => {
    if (!authUserId || !callId) return;

    let cancelled = false;
    let videoClient;
    let callInstance;
    let practiceSessionId;

    const initCall = async () => {
      try {
        console.log("Initializing Stream video client...");

        videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: { id: authUserId, name: authUser.fullName, image: authUser.profilePic },
          // the server only issues a token if you are a friend and a participant of this call
          tokenProvider: async () => (await getCallToken(callId)).token,
        });

        callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        if (cancelled) return; // cleanup below leaves the call
        console.log("Joined call successfully");

        // practice stats: failing to record a session must never break the call
        startPracticeSession(callId)
          .then(({ sessionId }) => {
            practiceSessionId = sessionId;
            if (cancelled) endPracticeSession(sessionId).catch(() => {});
          })
          .catch((error) => console.error("Could not start practice session:", error));

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        if (cancelled) return;
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        if (!cancelled) setIsConnecting(false);
      }
    };

    initCall();

    return () => {
      cancelled = true;
      setClient(null);
      setCall(null);
      // leave the call and drop the websocket so nothing leaks when navigating away
      if (practiceSessionId) endPracticeSession(practiceSessionId).catch(() => {});
      callInstance?.leave().catch(() => {});
      videoClient?.disconnectUser().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-join only when the user or call changes
  }, [authUserId, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) navigate("/");
  }, [callingState, navigate]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;