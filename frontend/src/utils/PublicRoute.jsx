import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Guards public-only routes (e.g. /login, /register): a signed-in user
// visiting these should land back on the app, not see the auth forms again.
function PublicRoute() {
  const { authUser } = useAuth();
  return authUser ? <Navigate to="/" replace /> : <Outlet />;
}

export default PublicRoute;
