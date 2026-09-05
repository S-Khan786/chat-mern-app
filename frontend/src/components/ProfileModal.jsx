import { IoClose } from "react-icons/io5";
import { FiMoon, FiSun } from "react-icons/fi";
import { BiLogOut } from "react-icons/bi";
import Avatar from "./Avatar.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const ProfileModal = ({ user, onClose, onLogOut }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your account"
      className="fixed inset-0 z-50 grid place-items-end p-0 sm:place-items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="theme-surface animate-rise relative w-full max-w-sm rounded-t-[1.75rem] border p-6 shadow-2xl sm:rounded-[1.75rem]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account panel"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/[.07] text-slate-300 transition hover:bg-white/[.14]"
        >
          <IoClose className="text-lg" />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <Avatar src={user?.profilePic} name={user?.fullname || user?.username} size={22} className="mb-3" />
          <h2 className="text-lg font-semibold text-white">{user?.fullname || "Your account"}</h2>
          <p className="text-sm text-slate-400">@{user?.username || "username"}</p>
        </div>

        <dl className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Email</dt>
            <dd className="truncate text-slate-100">{user?.email || "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Username</dt>
            <dd className="text-slate-100">@{user?.username || "—"}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={toggleTheme}
          className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[.09]"
        >
          <span className="flex items-center gap-2">{theme === "dark" ? <FiSun /> : <FiMoon />} Appearance</span>
          <span className="text-slate-400">{theme === "dark" ? "Light" : "Dark"} mode</span>
        </button>

        <button
          type="button"
          onClick={onLogOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
        >
          <BiLogOut className="text-lg" /> Log out
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
