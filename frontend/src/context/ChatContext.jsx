import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatContext = createContext({ client: null, unreadCount: 0 });

// One Stream connection for the whole logged-in app: chat pages, unread badges and presence share it.
export const ChatProvider = ({ children }) => {
  const { authUser } = useAuthUser();
  const authUserId = authUser?._id;

  const [client, setClient] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authUserId) return;

    let cancelled = false;
    const chatClient = StreamChat.getInstance(STREAM_API_KEY);

    // events that carry the user's total unread count (connection.ok, message.new, notification.*)
    const subscription = chatClient.on((event) => {
      if (typeof event.total_unread_count === "number") setUnreadCount(event.total_unread_count);
    });

    chatClient
      .connectUser(
        { id: authUserId, name: authUser.fullName, image: authUser.profilePic },
        // a token provider lets Stream fetch a fresh token when the old one expires
        async () => (await getStreamToken()).token
      )
      .then(() => {
        if (cancelled) return;
        setClient(chatClient);
        setUnreadCount(chatClient.user?.total_unread_count ?? 0);
      })
      .catch((error) => console.error("Could not connect to Stream chat:", error));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      setClient(null);
      chatClient.disconnectUser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when the logged-in user changes
  }, [authUserId]);

  return <ChatContext.Provider value={{ client, unreadCount }}>{children}</ChatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook lives next to its provider
export const useChat = () => useContext(ChatContext);
