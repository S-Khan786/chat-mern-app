import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import AuthHero from "../components/AuthHero.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const [userInput, setUserInput] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", userInput);
      toast.success(data.message);
      localStorage.setItem("chatapp", JSON.stringify(data));
      setAuthUser(data);
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise flex w-full max-w-4xl items-stretch gap-6">
      <AuthHero
        eyebrow="Welcome back"
        title="Pick up the conversation, right where it left off."
        blurb="Every chat, every group, every reaction — waiting for you the second you sign in."
      />

      <div className="auth-card glass-panel w-full max-w-md shrink-0 rounded-[2rem] p-6 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8">
          <div className="brand-mark mb-5 h-12 w-12 rounded-2xl text-xl lg:hidden">C</div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-violet-300">Sign in</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-white">Good to see you again.</h1>
          <p className="mt-2 text-sm text-slate-300">Enter your details to open your conversations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block" htmlFor="email">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              onChange={(e) => setUserInput({ ...userInput, email: e.target.value })}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-white/10 bg-[#09151d]/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
            />
          </label>

          <label className="block" htmlFor="password">
            <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
            <span className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                onChange={(e) => setUserInput({ ...userInput, password: e.target.value })}
                placeholder="Your password"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09151d]/70 px-4 py-3 pr-11 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:text-slate-200"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 font-semibold text-[#241014] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm" /> Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          New to Chatters?{" "}
          <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
