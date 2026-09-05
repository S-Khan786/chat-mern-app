import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";
import AuthHero from "../components/AuthHero.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inputData, setInputData] = useState({});

  const update = (event) => setInputData({ ...inputData, [event.target.id]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inputData.password !== inputData.confirmpassword) return toast.error("Passwords don't match");
    if (!inputData.gender) return toast.error("Please choose how you identify");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", inputData);
      toast.success(data.message);
      localStorage.setItem("chatapp", JSON.stringify(data));
      setAuthUser(data);
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type = "text", placeholder = "", autoComplete) => (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        onChange={update}
        placeholder={placeholder}
        required
        className="w-full rounded-xl border border-white/10 bg-[#09151d]/70 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
      />
    </label>
  );

  return (
    <div className="animate-rise flex w-full max-w-4xl items-stretch gap-6">
      <AuthHero
        eyebrow="Join Chatters"
        title="Your people are already here. Come say hi."
        blurb="Create an account in seconds and start a conversation, a group, or just a quick hello."
      />

      <div className="auth-card glass-panel w-full max-w-lg shrink-0 rounded-[2rem] p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-6">
          <div className="brand-mark mb-4 h-11 w-11 rounded-2xl text-lg lg:hidden">C</div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-violet-300">Create account</p>
          <h1 className="font-display mt-1 text-3xl font-bold text-white">Let's get you set up.</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
          {field("fullname", "Full name", "text", "Jane Doe", "name")}
          {field("username", "Username", "text", "janedoe", "username")}
          {field("email", "Email address", "email", "you@example.com", "email")}
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            {field("password", "Password", "password", "At least 6 characters", "new-password")}
            {field("confirmpassword", "Confirm password", "password", "Repeat password", "new-password")}
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-slate-200">I identify as</legend>
            <div className="flex gap-3">
              {["male", "female"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setInputData({ ...inputData, gender: option })}
                  aria-pressed={inputData.gender === option}
                  className={`rounded-xl px-4 py-2 text-sm capitalize transition ${
                    inputData.gender === option
                      ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-[#241014] font-semibold"
                      : "bg-white/[.06] text-slate-300 hover:bg-white/[.1]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 font-semibold text-[#241014] shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60 sm:col-span-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm" /> Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already here?{" "}
          <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
