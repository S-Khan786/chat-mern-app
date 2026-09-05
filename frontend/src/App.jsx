import Login from "./login/Login.jsx";
import Register from "./register/Register.jsx";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import Home from "./home/Home.jsx";
import VerifyUser from "./utils/VerifyUser.jsx";

function App() {
  return (
    <>
      <div className="min-h-screen w-full p-3 sm:p-6 lg:p-8 flex items-center justify-center">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<VerifyUser />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>

        <ToastContainer theme="dark" position="top-right" />
      </div>
    </>
  );
}

export default App;

