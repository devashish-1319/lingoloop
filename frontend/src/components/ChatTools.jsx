import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useChannelStateContext } from "stream-chat-react";
import toast from "react-hot-toast";
import { LightbulbIcon, LanguagesIcon } from "lucide-react";
import { getConversationTopics, translateText } from "../lib/api";
import { getErrorMessage } from "../lib/utils";

// Claude-powered helpers shown next to a conversation: translate what your partner wrote, get conversation starters.
const ChatTools = ({ channel, friendId, myId }) => {
  const { messages } = useChannelStateContext();
  const [translations, setTranslations] = useState({});

  const { mutate: loadTopics, data: topicsData, isPending: loadingTopics } = useMutation({
    mutationFn: () => getConversationTopics(friendId),
    onError: (error) => toast.error(getErrorMessage(error, "Could not get suggestions")),
  });

  const { mutate: translate, variables: translating, isPending: isTranslating } = useMutation({
    mutationFn: ({ text }) => translateText({ text }),
    onSuccess: ({ translation }, { id }) => setTranslations((prev) => ({ ...prev, [id]: translation })),
    onError: (error) => toast.error(getErrorMessage(error, "Could not translate")),
  });

  const partnerMessages = messages
    .filter((m) => m.user?.id !== myId && m.text && m.type === "regular")
    .slice(-5)
    .reverse();

  return (
    <aside
      className="w-72 shrink-0 border-l border-base-300 bg-base-200 p-4 space-y-6 overflow-y-auto h-full"
      aria-label="Learning tools"
    >
      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <LightbulbIcon className="size-4" aria-hidden="true" /> Conversation ideas
        </h2>
        <button className="btn btn-sm btn-outline w-full" onClick={() => loadTopics()} disabled={loadingTopics}>
          {loadingTopics ? "Thinking..." : topicsData ? "New ideas" : "Suggest topics"}
        </button>
        <ul className="space-y-2">
          {topicsData?.topics.map((topic) => (
            <li key={topic}>
              <button
                className="text-left text-sm w-full p-2 rounded-lg bg-base-100 hover:bg-primary/10"
                onClick={() => channel.sendMessage({ text: topic })}
                title="Click to send"
              >
                {topic}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <LanguagesIcon className="size-4" aria-hidden="true" /> Translate
        </h2>
        {partnerMessages.length === 0 ? (
          <p className="text-sm opacity-70">Messages from your partner appear here.</p>
        ) : (
          <ul className="space-y-3">
            {partnerMessages.map((m) => (
              <li key={m.id} className="text-sm bg-base-100 rounded-lg p-2 space-y-1">
                <p>{m.text}</p>
                {translations[m.id] ? (
                  <p className="text-primary">{translations[m.id]}</p>
                ) : (
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => translate({ id: m.id, text: m.text })}
                    disabled={isTranslating && translating?.id === m.id}
                  >
                    {isTranslating && translating?.id === m.id ? "Translating..." : "Translate"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};

export default ChatTools;
