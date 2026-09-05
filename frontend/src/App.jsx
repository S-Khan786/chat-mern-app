import Login from "./login/Login.jsx";
import Register from "./register/Register.jsx";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import Home from "./home/Home.jsx";
import VerifyUser from "./utils/VerifyUser.jsx";

function App() {
  return (
    <>
      <div className="flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden p-2 sm:p-4 lg:p-8">
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
