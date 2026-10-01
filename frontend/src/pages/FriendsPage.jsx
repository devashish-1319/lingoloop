import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BanIcon, FlagIcon, UserMinusIcon } from "lucide-react";
import { blockUser, getUserFriends, unfriend } from "../lib/api";
import { getErrorMessage } from "../lib/utils";
import usePresence from "../hooks/usePresence";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import ReportDialog from "../components/ReportDialog";

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const [reporting, setReporting] = useState(null);

  const { data: friends = [], isLoading } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });
  const online = usePresence(useMemo(() => friends.map((f) => f._id), [friends]));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const { mutate: unfriendMutation } = useMutation({
    mutationFn: unfriend,
    onSuccess: () => {
      toast.success("Friend removed");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const { mutate: blockMutation } = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["blocked"] });
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const confirmThen = (message, action) => () => {
    if (window.confirm(message)) action();
  };

  // online friends first
  const sorted = [...friends].sort((a, b) => Number(online.has(b._id)) - Number(online.has(a._id)));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Friends</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                online={online.has(friend._id)}
                actions={
                  <div className="dropdown dropdown-end">
                    <button
                      tabIndex={0}
                      className="btn btn-ghost btn-square"
                      aria-label={`More actions for ${friend.fullName}`}
                    >
                      ⋯
                    </button>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box shadow-lg w-48 z-10 p-2 border border-base-300"
                    >
                      <li>
                        <button
                          onClick={confirmThen(`Remove ${friend.fullName} from your friends?`, () =>
                            unfriendMutation(friend._id)
                          )}
                        >
                          <UserMinusIcon className="size-4" aria-hidden="true" /> Unfriend
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={confirmThen(
                            `Block ${friend.fullName}? They will no longer be able to contact you.`,
                            () => blockMutation(friend._id)
                          )}
                        >
                          <BanIcon className="size-4" aria-hidden="true" /> Block
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setReporting(friend)}>
                          <FlagIcon className="size-4" aria-hidden="true" /> Report
                        </button>
                      </li>
                    </ul>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {reporting && <ReportDialog user={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
};

export default FriendsPage;
