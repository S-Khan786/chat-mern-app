import { useEffect, useRef, useState } from "react";
import { TiMessages } from "react-icons/ti";
import { IoArrowBackSharp, IoSend } from "react-icons/io5";
import axios from "axios";
import userConversation from "../../Zustans/useConversation";
import { useAuth } from "../../context/AuthContext";
import { useSocketContext } from "../../context/socketContext.jsx";
import notify from "../../assets/sound/notification.mp3";

const MessageContainer = ({ onBackUser }) => {
  const { messages, setMessage, selectedConversation } = userConversation();
  const { socket } = useSocketContext();
  const { authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendData, setSendData] = useState("");
  const lastMessageRef = useRef();

  useEffect(() => {
    const receiveMessage = (newMessage) => { new Audio(notify).play(); setMessage([...messages, newMessage]); };
    socket?.on("newMessage", receiveMessage);
    return () => socket?.off("newMessage", receiveMessage);
  }, [socket, setMessage, messages]);

  useEffect(() => { setTimeout(() => lastMessageRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }, [messages]);

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try { const { data } = await axios.get(`/api/message/${selectedConversation._id}?limit=30`); setMessage(data.messages || []); }
      catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sendData.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(`/api/message/send/${selectedConversation?._id}`, { message: sendData });
      setSendData(""); setMessage([...messages, data]);
    } catch (error) { console.error(error); }
    finally { setSending(false); }
  };

  if (!selectedConversation) return <section className="flex flex-1 items-center justify-center p-8"><div className="max-w-sm text-center"><div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 ring-1 ring-white/10"><TiMessages className="text-5xl text-violet-200" /></div><p className="text-2xl font-semibold text-white">Welcome back, {authUser?.username}</p><p className="mt-3 text-sm leading-6 text-slate-400">Choose a conversation and turn a quiet moment into something meaningful.</p></div></section>;

  return <section className="flex h-full min-w-0 flex-1 flex-col">
    <header className="flex items-center gap-3 border-b border-white/10 bg-[#101932]/55 px-4 py-3.5 sm:px-6">
      <button onClick={onBackUser} aria-label="Back to messages" className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.07] text-slate-200 transition hover:bg-white/[.13] md:hidden"><IoArrowBackSharp /></button>
      <div className="relative"><img className="h-10 w-10 rounded-xl object-cover" src={selectedConversation.profilePic} alt="" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#16213d] bg-emerald-400" /></div>
      <div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-white">{selectedConversation.username}</h2><p className="text-xs text-emerald-300">Active now</p></div>
      <span className="hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs text-slate-400 sm:block">End-to-end vibes</span>
    </header>
    <div className="scrollbar flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(124,92,255,.08),transparent_36rem)] px-4 py-5 sm:px-6">
      {loading && <div className="grid h-full place-items-center"><span className="loading loading-spinner text-violet-300" /></div>}
      {!loading && !messages?.length && <div className="grid h-full place-items-center text-center text-sm text-slate-400"><div><span className="mb-3 block text-3xl">👋</span>Say hello and start the conversation.</div></div>}
      {!loading && messages?.map((message) => {
        const mine = message.senderId === authUser._id;
        return <div key={message._id} ref={lastMessageRef} className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] sm:max-w-[68%] ${mine ? "items-end" : "items-start"} flex flex-col`}><div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-lg ${mine ? "rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-950/30" : "rounded-bl-md border border-white/10 bg-white/[.08] text-slate-100"}`}>{message.message}</div><time className="mt-1.5 px-1 text-[10px] text-slate-500">{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}</time></div></div>;
      })}
    </div>
    <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#101932]/60 p-3 sm:p-4"><div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.07] p-1.5 focus-within:border-violet-400/60"><input value={sendData} onChange={(event) => setSendData(event.target.value)} id="message" type="text" placeholder="Write a message..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" /><button disabled={sending} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:opacity-60">{sending ? <span className="loading loading-spinner loading-sm" /> : <IoSend className="text-lg" />}</button></div></form>
  </section>;
};

export default MessageContainer;

