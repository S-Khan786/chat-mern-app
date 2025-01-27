import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

function VerifyUser() {
    const { authUser } = useAuth();
    return authUser ? <Outlet/> : <Navigate to={'/login'}/>
}

export default VerifyUser;
