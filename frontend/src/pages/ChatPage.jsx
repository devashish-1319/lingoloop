import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useChat } from "../context/ChatContext";
import { createChatChannel, ringFriend } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";
import { SparklesIcon } from "lucide-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import ChatTools from "../components/ChatTools";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [showTools, setShowTools] = useState(false);

  const { authUser } = useAuthUser();
  const { client: chatClient } = useChat(); // shared connection, owned by the layout

  useEffect(() => {
    if (!chatClient) return;

    let cancelled = false;
    setChannel(null);

    const openChannel = async () => {
      try {
        // the server verifies friendship and creates the channel (sorted ids, same for both users)
        const { channelId } = await createChatChannel(targetUserId);
        const currChannel = chatClient.channel("messaging", channelId);
        await currChannel.watch({ presence: true });

        if (!cancelled) setChannel(currChannel);
      } catch (error) {
        if (cancelled) return;
        console.error("Error opening chat:", error);
        toast.error("Could not open this chat. Are you still friends?");
        navigate("/friends", { replace: true });
      }
    };

    openChannel();
    return () => {
      cancelled = true;
    };
  }, [chatClient, targetUserId, navigate]);

  const handleVideoCall = async () => {
    if (!channel) return;

    const callUrl = `${window.location.origin}/call/${channel.id}`;
    channel.sendMessage({ text: `I've started a video call. Join me here: ${callUrl}` });

    // ring the friend if they have the app open, then join the call ourselves
    try {
      await ringFriend(targetUserId);
    } catch (error) {
      console.error("Could not ring friend:", error);
    }
    navigate(`/call/${channel.id}`);
  };

  if (!chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall}>
              <button
                className={`btn btn-sm ${showTools ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setShowTools((v) => !v)}
                aria-pressed={showTools}
                aria-label="Learning tools"
              >
                <SparklesIcon className="size-5" aria-hidden="true" />
              </button>
            </CallButton>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
          {showTools && <ChatTools channel={channel} friendId={targetUserId} myId={authUser._id} />}
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
