import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { CheckCircleIcon, MapPinIcon, SearchIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { capitalize, getErrorMessage } from "../lib/utils";
import { LANGUAGES } from "../constants";
import usePresence from "../hooks/usePresence";

import FriendCard from "../components/FriendCard";
import LanguageFlag from "../components/LanguageFlag";
import NoFriendsFound from "../components/NoFriendsFound";
import Avatar from "../components/Avatar";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [draftFilters, setDraftFilters] = useState({ search: "", language: "", learning: "", location: "" });
  const [filters, setFilters] = useState(draftFilters);

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const {
    data: recommendedPages,
    isLoading: loadingUsers,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", filters],
    queryFn: ({ pageParam }) =>
      getRecommendedUsers({
        page: pageParam,
        // drop empty filters so they aren't sent as ?language=
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const recommendedUsers = useMemo(
    () => recommendedPages?.pages.flatMap((page) => page.users) ?? [],
    [recommendedPages]
  );

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      // a request may have been auto-accepted if the other user had already sent one
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not send request")),
  });

  const onlineFriends = usePresence(useMemo(() => friends.map((f) => f._id), [friends]));

  const outgoingRequestsIds = useMemo(
    () => new Set((outgoingFriendReqs ?? []).map((req) => req.recipient._id)),
    [outgoingFriendReqs]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} online={onlineFriends.has(friend._id)} />
            ))}
          </div>
        )}

        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
                <p className="opacity-70">
                  Discover perfect language exchange partners based on your profile
                </p>
              </div>
            </div>
          </div>

          <form
            className="flex flex-wrap items-end gap-3 mb-6"
            role="search"
            aria-label="Find language partners"
            onSubmit={(e) => {
              e.preventDefault();
              setFilters(draftFilters);
            }}
          >
            <label className="form-control w-full sm:w-52">
              <span className="label-text mb-1">Name</span>
              <input
                className="input input-bordered input-sm"
                value={draftFilters.search}
                onChange={(e) => setDraftFilters({ ...draftFilters, search: e.target.value })}
                placeholder="Search by name"
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Speaks</span>
              <select
                className="select select-bordered select-sm"
                value={draftFilters.language}
                onChange={(e) => setDraftFilters({ ...draftFilters, language: e.target.value })}
              >
                <option value="">Any language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Learning</span>
              <select
                className="select select-bordered select-sm"
                value={draftFilters.learning}
                onChange={(e) => setDraftFilters({ ...draftFilters, learning: e.target.value })}
              >
                <option value="">Any language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control w-full sm:w-44">
              <span className="label-text mb-1">Location</span>
              <input
                className="input input-bordered input-sm"
                value={draftFilters.location}
                onChange={(e) => setDraftFilters({ ...draftFilters, location: e.target.value })}
                placeholder="City or country"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm">
              <SearchIcon className="size-4" aria-hidden="true" />
              Search
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const empty = { search: "", language: "", learning: "", location: "" };
                setDraftFilters(empty);
                setFilters(empty);
              }}
            >
              Clear
            </button>
          </form>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="text-base-content opacity-70">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <Avatar src={user.profilePic} name={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages with flags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          <LanguageFlag language={user.nativeLanguage} />
                          Native: {capitalize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          <LanguageFlag language={user.learningLanguage} />
                          Learning: {capitalize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Action button */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        } `}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button
                className="btn btn-outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;