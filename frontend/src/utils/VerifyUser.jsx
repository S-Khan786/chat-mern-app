import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Guards protected routes (e.g. "/"): signed-out visitors get bounced to /login.
function VerifyUser() {
  const { authUser } = useAuth();
  return authUser ? <Outlet /> : <Navigate to="/login" replace />;
}

export default VerifyUser;
