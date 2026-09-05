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

function Sidebar({ onSelectUser }) {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const { onlineUser, socket } = useSocketContext();
  const { theme, toggleTheme } = useTheme();
  const { messages, setSelectedConversation } = userConversation();
  const [searchInput, setSearchInput] = useState("");
  const [searchUser, setSearchUser] = useState([]);
  const [chatUser, setChatUser] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMessageUsers, setNewMessageUsers] = useState({});
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);

  useEffect(() => {
    socket?.on("newMessage", setNewMessageUsers);
    return () => socket?.off("newMessage");
  }, [socket, messages]);

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

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/user/search?search=${searchInput}`);
      if (!data?.length) toast.info("No users found");
      setSearchUser(data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

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
    onSelectUser(conversation); setSelectedConversation(conversation); setSelectedUserId(conversation._id); setNewMessageUsers({});
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
    if (window.prompt("Type your username to log out") !== authUser.username) return toast.info("Logout cancelled");
    try {
      const { data } = await axios.post("/api/auth/logout");
      toast.info(data?.message); localStorage.removeItem("chatapp"); setAuthUser(null); navigate("/login");
    } catch (error) { console.error(error); }
  };

  const users = (searchUser.length ? searchUser : chatUser).filter((user) => !groupMode || user.type !== "group");
  const isSearching = searchUser.length > 0;
  return (
    <aside className="sidebar-panel flex h-full min-h-0 w-full flex-col p-3 sm:p-5">
      <div className="mb-4 flex shrink-0 items-center gap-3 sm:mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black text-[#21151a] shadow-lg shadow-black/20">C</div>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">Chatters</p><h1 className="truncate text-lg font-semibold text-white">Good to see you</h1></div>
        <div className="flex items-center gap-2"><button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-violet-200 transition hover:border-violet-300/40 hover:bg-white/[.12]">{theme === "dark" ? <FiSun /> : <FiMoon />}</button><img onClick={() => navigate(`/profile/${authUser?._id}`)} src={authUser?.profilePic} alt="Your profile" className="h-10 w-10 cursor-pointer rounded-xl object-cover ring-2 ring-white/15 transition hover:ring-violet-400" /></div>
      </div>

      <form onSubmit={handleSearchSubmit} className="search-shell theme-input group mb-4 flex shrink-0 items-center rounded-2xl border px-3 py-1.5 transition focus-within:border-violet-400/60 sm:mb-5">
        <FaSearch className="ml-1 text-sm text-slate-400" />
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} type="search" placeholder="Search people" className="min-w-0 flex-1 px-3 py-2 text-sm text-white placeholder:text-slate-400" />
        <button aria-label="Search" className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500 text-xs text-white transition hover:bg-violet-400"><FaSearch /></button>
      </form>

      <div className="mb-3 flex shrink-0 items-center justify-between px-1"><h2 className="text-sm font-bold uppercase tracking-[.14em] text-slate-300">{isSearching ? "Search results" : "Messages"}</h2><button type="button" onClick={() => setGroupMode((current) => !current)} aria-label="Create group" className="sidebar-action grid h-8 w-8 place-items-center rounded-xl transition"><FaUsers /></button></div>
      {groupMode && <form onSubmit={handleCreateGroup} className="mb-4 shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 shadow-lg shadow-black/10"><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="mb-2 w-full rounded-xl border border-white/10 bg-[#09151d]/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" /><p className="mb-2 text-xs text-slate-400">Select members below: {groupMembers.length}</p><button className="w-full rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-[#21151a] transition hover:-translate-y-0.5 hover:bg-violet-400">Create group</button></form>}
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && <div className="grid h-32 place-items-center"><span className="loading loading-spinner text-violet-300" /></div>}
        {!loading && users.length === 0 && <div className="mt-10 px-5 text-center"><div className="mb-3 text-3xl">✨</div><p className="font-medium text-white">Your conversations will live here.</p><p className="mt-1 text-sm text-slate-400">Find someone by username to start.</p></div>}
        {users.map((user) => {
          const isGroup = user.type === "group";
          const displayName = isGroup ? user.name : user.username;
          const unread = newMessageUsers?.receiverId === authUser?._id && newMessageUsers?.senderId === user._id;
          const online = onlineUser.includes(user._id);
          const selectedForGroup = groupMembers.includes(user._id);
          return <button key={user._id} onClick={() => handleUserClick(user)} className={`conversation-item mb-1 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${selectedForGroup || selectedUserId === user._id ? "is-active text-white" : "text-slate-200"}`}>
            <div className="conversation-avatar relative shrink-0 rounded-xl p-0.5"><img src={isGroup ? (user.avatar || authUser?.profilePic) : user.profilePic} alt="" className="h-10 w-10 rounded-[.65rem] object-cover" />{online && !isGroup && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#16213d] bg-emerald-400" />}</div>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{displayName}</span><span className={`block truncate text-xs ${selectedUserId === user._id ? "text-violet-100" : "text-slate-400"}`}>{isGroup ? `${user.participants?.length || 0} members` : online ? "Online now" : "Tap to open conversation"}</span></span>
            {groupMode && <span className="grid h-5 min-w-5 place-items-center rounded-full border border-white/30 text-xs">{selectedForGroup ? "✓" : "+"}</span>}{unread && !groupMode && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-emerald-950">1</span>}
          </button>;
        })}
      </div>
      <div className="mt-3 shrink-0 border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
        {isSearching ? <button onClick={() => { setSearchUser([]); setSearchInput(""); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[.07]"><IoArrowBackSharp /> Back to messages</button> : <button onClick={handleLogOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-200"><BiLogOut className="text-lg" /> Log out</button>}
      </div>
    </aside>
  );
}

export default Sidebar;

