import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import { ChatProvider } from "../context/ChatContext";
import useRealtime from "../hooks/useRealtime";

// Persistent shell for all logged-in pages (one chat connection + one event stream for the whole session).
const Layout = () => {
  const { pathname } = useLocation();
  const showSidebar = !pathname.startsWith("/chat");

  useRealtime();

  return (
    <ChatProvider>
      <div className="min-h-screen">
        <div className="flex">
          {showSidebar && <Sidebar />}

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />

            {/* extra bottom padding keeps content clear of the fixed mobile nav */}
            <main className={`flex-1 overflow-y-auto ${showSidebar ? "pb-16 lg:pb-0" : ""}`}>
              <Outlet />
            </main>
          </div>
        </div>
        {showSidebar && <MobileNav />}
      </div>
    </ChatProvider>
  );
};
export default Layout;
