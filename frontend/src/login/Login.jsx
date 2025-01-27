import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const [userInput, setUserInput] = useState({}); // State to store form input values
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    setUserInput((prevData) => ({
      ...prevData, // Keep the previous form data
      [e.target.id]: e.target.value, // Update the value of the input with the matching id
    }));
  };

  // console.log(userInput);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const login = await axios.post(`/api/auth/login`, userInput); // backend give response after making http request using axios
      const data = login.data;
      if(data.success === false) {
        setLoading(false);
        console.log(data.message);
      }
      toast.success(data.message);
      localStorage.setItem('chatapp', JSON.stringify(data));
      setAuthUser(data);
      setLoading(false);
      navigate('/');
      
    } catch(err) {
      setLoading(false);
      console.log(err);
      toast.error(err?.response?.data?.message);
    }
  }


  return (
    <div className="flex flex-col items-center justify-center mix-w-full mx-auto">
      <div className="w-full p-6 rounded-lg shadow-lg bg-gray-400 bg-clip-padding backderop-filter backdrop-blur-lg bg-opacity-0">
        <h1 className="text-3xl font-bold text-center text-gray-300">
          Login
          <span className="text-gray-950"> Chatters </span>
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col text-white">
          <div>
            <label className="label p-2">
              <span className="font-bold text-gray-950 text-xl label-text">
                Email :
              </span>
            </label>
            <input
              id="email"
              type="email"
              onChange={handleInput}
              placeholder="Enter your email"
              required
              className="w-full input input-bordered h-10"
            />
          </div>
          <div>
            <label className="label p-2">
              <span className="font-bold text-gray-950 text-xl label-text">
                Password :
              </span>
            </label>
            <input
              id="password"
              type="password"
              onChange={handleInput}
              placeholder="Enter your password"
              required
              className="w-full input input-bordered h-10"
            />
          </div>
          <button
            type="submit"
            className="mt-4 self-center 
                            w-auto px-2 py-1 bg-gray-950 
                            text-lg hover:bg-gray-900 
                            text-white rounded-lg hover: scale-105"
          >
            {loading ? "loading...":"Login"}
          </button>
        </form>
        <div className="pt-2">
          <p
            className="text-sm font-semibold
                         text-gray-800"
          >
            Do not have an Account ?{" "}
            <Link to={"/register"}>
              <span
                className="text-gray-950 
                            font-bold underline cursor-pointer
                             hover:text-green-950"
              >
                Register Now!!
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
