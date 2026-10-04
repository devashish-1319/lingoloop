import { BarChart3Icon, BellIcon, HomeIcon, SettingsIcon, UsersIcon } from "lucide-react";
import useNotificationCount from "./useNotificationCount";
import { useChat } from "../context/ChatContext";

// the app's main navigation, with live badges; shared by the desktop sidebar and the mobile bottom bar
const useNavLinks = () => {
  const notificationCount = useNotificationCount();
  const { unreadCount } = useChat();

  return [
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
};

export default useNavLinks;
