import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";

import PageLoader from "./components/PageLoader.jsx";
import Layout from "./components/Layout.jsx";
import { OnboardingRoute, ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import { useThemeStore } from "./store/useThemeStore.js";

// the Stream chat / video SDKs are large, so only load them when needed
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const CallPage = lazy(() => import("./pages/CallPage.jsx"));

const App = () => {
  const { isLoading, isError, refetch } = useAuthUser();
  const { theme } = useThemeStore();

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" data-theme={theme}>
        <p>Could not reach the server. Please check your connection.</p>
        <button className="btn btn-primary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen" data-theme={theme}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Route>

          <Route
            path="/call/:id"
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUpPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingPage />
              </OnboardingRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <Toaster />
    </div>
  );
};
export default App;
