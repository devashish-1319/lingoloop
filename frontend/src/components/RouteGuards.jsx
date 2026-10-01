import { Navigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";

const redirectFor = (authUser) => (authUser.isOnboarded ? "/" : "/onboarding");

// logged in and onboarded
export const ProtectedRoute = ({ children }) => {
  const { authUser } = useAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (!authUser.isOnboarded) return <Navigate to="/onboarding" replace />;
  return children;
};

// login / signup: only for logged-out users
export const PublicOnlyRoute = ({ children }) => {
  const { authUser } = useAuthUser();
  return authUser ? <Navigate to={redirectFor(authUser)} replace /> : children;
};

// logged in but not yet onboarded
export const OnboardingRoute = ({ children }) => {
  const { authUser } = useAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.isOnboarded) return <Navigate to="/" replace />;
  return children;
};
