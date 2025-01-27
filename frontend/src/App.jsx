import Login from "./login/Login.jsx";
import Register from "./register/Register.jsx";
import { ToastContainer } from 'react-toastify';
import { Route, Routes } from 'react-router-dom';
function App() {

  return (
    <>
      <div className="p-2 w-screen h-screen flex items-center justify-center">
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
      </Routes>

        <ToastContainer/>
      </div>

    </>
  )
}

export default App
