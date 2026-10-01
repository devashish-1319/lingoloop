import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, SettingsIcon, ShipWheelIcon } from "lucide-react";
import useNotificationCount from "../hooks/useNotificationCount";
import CountBadge from "./CountBadge";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();
  const notificationCount = useNotificationCount();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Streamify
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link
              to="/notifications"
              className="btn btn-ghost btn-circle relative"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-base-content opacity-70" aria-hidden="true" />
              <CountBadge
                count={notificationCount}
                label="pending friend requests"
                className="absolute -top-1 -right-1"
              />
            </Link>
            <Link to="/settings" className="btn btn-ghost btn-circle" aria-label="Settings">
              <SettingsIcon className="h-6 w-6 text-base-content opacity-70" aria-hidden="true" />
            </Link>
          </div>

          <ThemeSelector />

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img src={authUser?.profilePic} alt="" />
            </div>
          </div>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation} aria-label="Log out">
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
