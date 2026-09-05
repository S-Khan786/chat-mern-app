import { useEffect, useState } from "react";
import { FaSearch, FaUsers } from "react-icons/fa";
import { FiMoon, FiSun } from "react-icons/fi";
import { BiLogOut } from "react-icons/bi";
import { IoArrowBackSharp } from "react-icons/io5";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import userConversation from "../../Zustans/useConversation.jsx";
import { useSocketContext } from "../../context/socketContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import Avatar from "../../components/Avatar.jsx";
import ProfileModal from "../../components/ProfileModal.jsx";

function Sidebar({ onSelectUser }) {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const { onlineUser, socket } = useSocketContext();
  const { theme, toggleTheme } = useTheme();
  const { setSelectedConversation } = userConversation();
  const [searchInput, setSearchInput] = useState("");
  const [searchUser, setSearchUser] = useState([]);
  const [chatUser, setChatUser] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const handleNewMessage = (message) => {
      const senderId = String(message.senderId?._id || message.senderId);
      const currentUserId = String(authUser?._id);
      if (senderId === currentUserId) return;
      const isGroupMessage = Boolean(message.conversationId && !message.receiverId);
      const conversationKey = isGroupMessage
        ? String(message.conversationId)
        : senderId === currentUserId ? String(message.receiverId) : senderId;
      if (String(selectedUserId) === conversationKey) return;
      setUnreadCounts((current) => ({ ...current, [conversationKey]: (current[conversationKey] || 0) + 1 }));
    };
    socket?.on("newMessage", handleNewMessage);
    return () => socket?.off("newMessage", handleNewMessage);
  }, [socket, authUser?._id, selectedUserId]);

  useEffect(() => {
    const addConversation = (conversation) => {
      setChatUser((current) => [conversation, ...current.filter((item) => item._id !== conversation._id)]);
    };
    socket?.on("conversationCreated", addConversation);
    return () => socket?.off("conversationCreated", addConversation);
  }, [socket]);

  useEffect(() => {
    const loadChatters = async () => {
      setLoading(true);
      try { const { data } = await axios.get("/api/user/currentchatters"); setChatUser(data); }
      catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    loadChatters();
  }, []);

  useEffect(() => {
    const search = searchInput.trim();
    if (!search) {
      setSearchUser([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/user/search?search=${encodeURIComponent(search)}`);
        setSearchUser(data || []);
      } catch (error) {
        console.error("Live search error:", error);
        setSearchUser([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleUserClick = async (user) => {
    if (groupMode) {
      setGroupMembers((current) => current.includes(user._id) ? current.filter((id) => id !== user._id) : [...current, user._id]);
      return;
    }
    let conversation = user;
    if (user.type === "group") {
      try {
        const { data } = await axios.get(`/api/conversation/${user._id}`);
        conversation = data;
        setChatUser((current) => current.map((item) => item._id === data._id ? data : item));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load group members");
        return;
      }
    }
    onSelectUser(conversation); setSelectedConversation(conversation); setSelectedUserId(conversation._id); setUnreadCounts((current) => ({ ...current, [conversation._id]: 0 }));
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!groupName.trim() || groupMembers.length === 0) return toast.info("Add a group name and at least one member");
    try {
      const { data } = await axios.post("/api/conversation/group", { name: groupName.trim(), participants: groupMembers });
      setChatUser((current) => [data, ...current.filter((item) => item._id !== data._id)]);
      setGroupMode(false); setGroupName(""); setGroupMembers([]); onSelectUser(data); setSelectedConversation(data); setSelectedUserId(data._id);
    } catch (error) { toast.error(error?.response?.data?.message || "Unable to create group"); }
  };

  const handleLogOut = async () => {
    try {
      const { data } = await axios.post("/api/auth/logout");
      toast.info(data?.message); localStorage.removeItem("chatapp"); setAuthUser(null); navigate("/login");
    } catch (error) { console.error(error); }
  };

  const isSearching = searchInput.trim().length > 0;
  const users = (isSearching ? searchUser : chatUser).filter((user) => !groupMode || user.type !== "group");

  return (
    <aside className="sidebar-panel flex h-full min-h-0 w-full flex-col p-3 sm:p-5">
      <div className="mb-4 flex shrink-0 items-center gap-3 sm:mb-5">
        <div className="brand-mark h-11 w-11 rounded-2xl text-lg shadow-lg shadow-black/20">C</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">Chatters</p>
          <h1 className="font-display max-w-[9rem] truncate text-base font-semibold leading-tight text-white sm:text-lg">Good to see you</h1>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-violet-200 transition hover:border-violet-300/40 hover:bg-white/[.12]"
        >
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowProfile(true)}
        className="mb-4 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-3 text-left transition hover:border-violet-300/30 hover:bg-white/[.08]"
      >
        <Avatar src={authUser?.profilePic} name={authUser?.fullname || authUser?.username} size={10} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{authUser?.fullname || "Your profile"}</span>
          <span className="block truncate text-xs text-slate-400">@{authUser?.username || "username"}</span>
        </span>
        <span className="ml-auto shrink-0 text-xs text-slate-400">Account</span>
      </button>

      <form onSubmit={(event) => event.preventDefault()} className="search-shell theme-input group mb-4 flex shrink-0 items-center rounded-2xl border px-3 py-1.5 transition focus-within:border-violet-400/60 sm:mb-5">
        <FaSearch className="ml-1 text-sm text-slate-400" />
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} type="search" placeholder="Search people" aria-label="Search people" className="min-w-0 flex-1 px-3 py-2 text-sm text-white placeholder:text-slate-400" />
        <button aria-label="Search" className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500 text-xs text-[#241014] transition hover:bg-violet-400"><FaSearch /></button>
      </form>

      <div className="mb-3 flex shrink-0 items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-[.14em] text-slate-300">{isSearching ? "Search results" : "Messages"}</h2>
        <button type="button" onClick={() => setGroupMode((current) => !current)} aria-label="Create group" aria-pressed={groupMode} className="sidebar-action grid h-8 w-8 place-items-center rounded-xl transition"><FaUsers /></button>
      </div>

      {groupMode && (
        <form onSubmit={handleCreateGroup} className="animate-rise mb-4 shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 shadow-lg shadow-black/10">
          <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="mb-2 w-full rounded-xl border border-white/10 bg-[#09151d]/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
          <p className="mb-2 text-xs text-slate-400">Select members below: {groupMembers.length}</p>
          <button className="w-full rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-[#241014] transition hover:-translate-y-0.5 hover:bg-violet-400">Create group</button>
        </form>
      )}

      <div className="scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="flex animate-pulse items-center gap-3 rounded-2xl p-2.5">
                <div className="h-10 w-10 rounded-xl bg-white/[.06]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-white/[.06]" />
                  <div className="h-2.5 w-1/3 rounded bg-white/[.05]" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && users.length === 0 && (
          <div className="mt-10 px-5 text-center">
            <div className="mb-3 text-3xl">{isSearching ? "⌕" : "✨"}</div>
            <p className="font-medium text-white">{isSearching ? "No people found" : "Your conversations will live here."}</p>
            <p className="mt-1 text-sm text-slate-400">{isSearching ? "Try another username or name." : "Find someone by username to start."}</p>
          </div>
        )}
        {!loading && users.map((user) => {
          const isGroup = user.type === "group";
          const displayName = isGroup ? user.name : user.username;
          const unread = unreadCounts[user._id] || 0;
          const online = onlineUser.includes(user._id);
          const selectedForGroup = groupMembers.includes(user._id);
          return (
            <button
              key={user._id}
              onClick={() => handleUserClick(user)}
              className={`conversation-item mb-1 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${selectedForGroup || selectedUserId === user._id ? "is-active text-white" : "text-slate-200"}`}
            >
              <Avatar
                src={isGroup ? (user.avatar || authUser?.profilePic) : user.profilePic}
                name={displayName}
                size={10}
                online={online && !isGroup}
                className="conversation-avatar rounded-xl p-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{displayName}</span>
                <span className={`block truncate text-xs ${selectedUserId === user._id ? "text-violet-100" : "text-slate-400"}`}>
                  {isGroup ? `${user.participants?.length || 0} members` : online ? "Online now" : "Tap to open conversation"}
                </span>
              </span>
              {groupMode && <span className="grid h-5 min-w-5 place-items-center rounded-full border border-white/30 text-xs">{selectedForGroup ? "✓" : "+"}</span>}
              {unread > 0 && !groupMode && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-cyan-400 px-1.5 text-[11px] font-bold text-[#09201f]">{unread > 99 ? "99+" : unread}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 shrink-0 border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
        {isSearching ? (
          <button onClick={() => { setSearchUser([]); setSearchInput(""); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[.07]">
            <IoArrowBackSharp /> Back to messages
          </button>
        ) : (
          <button onClick={handleLogOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-200">
            <BiLogOut className="text-lg" /> Log out
          </button>
        )}
      </div>

      {showProfile && <ProfileModal user={authUser} onClose={() => setShowProfile(false)} onLogOut={handleLogOut} />}
    </aside>
  );
}

export default Sidebar;
