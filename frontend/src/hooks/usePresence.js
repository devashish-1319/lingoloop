import { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";

// Returns a Set of the given user ids that are currently online (live-updated via Stream presence).
const usePresence = (userIds) => {
  const { client } = useChat();
  const [online, setOnline] = useState(() => new Set());
  const key = userIds.join(",");

  useEffect(() => {
    if (!client || !key) return;

    let cancelled = false;
    const ids = key.split(",");

    client
      .queryUsers({ id: { $in: ids } }, {}, { presence: true })
      .then(({ users }) => {
        if (!cancelled) setOnline(new Set(users.filter((u) => u.online).map((u) => u.id)));
      })
      .catch((error) => console.error("Presence query failed:", error));

    const subscription = client.on("user.presence.changed", (event) => {
      const { id, online: isOnline } = event.user;
      if (!ids.includes(id)) return;
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(id);
        else next.delete(id);
        return next;
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [client, key]);

  return online;
};

export default usePresence;
