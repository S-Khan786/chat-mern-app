import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const [userInput, setUserInput] = useState({});
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault(); setLoading(true);
    try { const { data } = await axios.post("/api/auth/login", userInput); toast.success(data.message); localStorage.setItem("chatapp", JSON.stringify(data)); setAuthUser(data); navigate("/"); }
    catch (error) { toast.error(error?.response?.data?.message || "Unable to sign in"); }
    finally { setLoading(false); }
  };
  return <div className="auth-card glass-panel w-full max-w-md rounded-[2rem] p-6 shadow-2xl shadow-black/30 sm:p-9"><div className="mb-8"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-black text-[#10202a]">C</div><p className="text-sm font-semibold uppercase tracking-[.2em] text-violet-300">Welcome back</p><h1 className="mt-2 text-3xl font-bold text-white">Pick up the conversation.</h1><p className="mt-2 text-sm text-slate-300">Sign in to see what you missed.</p></div><form onSubmit={handleSubmit} className="space-y-4"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-200">Email address</span><input id="email" type="email" onChange={(e) => setUserInput({ ...userInput, email: e.target.value })} placeholder="you@example.com" required className="w-full rounded-xl border border-white/10 bg-[#09151d]/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-200">Password</span><input id="password" type="password" onChange={(e) => setUserInput({ ...userInput, password: e.target.value })} placeholder="Your password" required className="w-full rounded-xl border border-white/10 bg-[#09151d]/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15" /></label><button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 font-semibold text-[#21151a] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button></form><p className="mt-6 text-center text-sm text-slate-300">New to Chatters? <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">Create an account</Link></p></div>;
};
export default Login;

