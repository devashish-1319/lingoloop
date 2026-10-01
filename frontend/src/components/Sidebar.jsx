import { createElement } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import useNotificationCount from "../hooks/useNotificationCount";
import { useChat } from "../context/ChatContext";
import CountBadge from "./CountBadge";
import {
  BarChart3Icon,
  BellIcon,
  HomeIcon,
  SettingsIcon,
  ShipWheelIcon,
  UsersIcon,
} from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const notificationCount = useNotificationCount();
  const { unreadCount } = useChat();

  const links = [
    { to: "/", label: "Home", Icon: HomeIcon },
    { to: "/friends", label: "Friends", Icon: UsersIcon, badge: unreadCount, badgeLabel: "unread messages" },
    {
      to: "/notifications",
      label: "Notifications",
      Icon: BellIcon,
      badge: notificationCount,
      badgeLabel: "pending friend requests",
    },
    { to: "/progress", label: "Progress", Icon: BarChart3Icon },
    { to: "/settings", label: "Settings", Icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            Streamify
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Main">
        {links.map(({ to, label, Icon, badge, badgeLabel }) => (
          <Link
            key={to}
            to={to}
            aria-current={currentPath === to ? "page" : undefined}
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === to ? "btn-active" : ""
            }`}
          >
            {createElement(Icon, {
              className: "size-5 text-base-content opacity-70",
              "aria-hidden": true,
            })}
            <span>{label}</span>
            <CountBadge count={badge} label={badgeLabel} className="ml-auto" />
          </Link>
        ))}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={authUser?.profilePic} alt="" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" aria-hidden="true" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
