import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

// number of pending incoming friend requests (kept fresh by the realtime hook, which invalidates this query)
const useNotificationCount = () => {
  const { data } = useQuery({ queryKey: ["friendRequests"], queryFn: getFriendRequests });
  return data?.incomingReqs?.length ?? 0;
};

export default useNotificationCount;
