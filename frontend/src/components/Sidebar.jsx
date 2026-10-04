import { createElement } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import useNavLinks from "../hooks/useNavLinks";
import CountBadge from "./CountBadge";
import { ShipWheelIcon } from "lucide-react";
import Avatar from "./Avatar";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const links = useNavLinks();

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            Lingoloop
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
              <Avatar src={authUser?.profilePic} name={authUser?.fullName} />
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
