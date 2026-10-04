import { createElement } from "react";
import { Link, useLocation } from "react-router";
import useNavLinks from "../hooks/useNavLinks";
import CountBadge from "./CountBadge";

// Bottom navigation for phones/tablets, where the sidebar is hidden.
const MobileNav = () => {
  const { pathname } = useLocation();
  const links = useNavLinks();

  return (
    <nav
      aria-label="Mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-base-200 border-t border-base-300 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.map(({ to, label, Icon, badge, badgeLabel }) => (
        <Link
          key={to}
          to={to}
          aria-current={pathname === to ? "page" : undefined}
          className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
            pathname === to ? "text-primary font-semibold" : "opacity-70"
          }`}
        >
          {createElement(Icon, { className: "size-5", "aria-hidden": true })}
          <span>{label}</span>
          <CountBadge count={badge} label={badgeLabel} className="absolute top-1 left-1/2 ml-2" />
        </Link>
      ))}
    </nav>
  );
};

export default MobileNav;
