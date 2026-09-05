import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TiMessages } from "react-icons/ti";
import { IoArrowBackSharp, IoSend } from "react-icons/io5";
import axios from "axios";
import userConversation from "../../Zustans/useConversation";
import { useAuth } from "../../context/AuthContext";
import { useSocketContext } from "../../context/socketContext.jsx";
import notify from "../../assets/sound/notification.mp3";

const MessageContainer = ({ onBackUser }) => {
  const { messages, setMessage, selectedConversation } = userConversation();
  const { socket, incomingMessages } = useSocketContext();
  const { authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendData, setSendData] = useState("");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [typingUser, setTypingUser] = useState(false);
  const typingTimeout = useRef();
  const messageListRef = useRef();
  const handledMessageIds = useRef(new Set());

  const isGroup = selectedConversation?.type === "group";
  const messageBelongsToSelectedConversation = (incomingMessage) => {
    const messageConversationId = String(incomingMessage.conversationId);
    const selectedId = String(selectedConversation?._id);
    const senderId = String(incomingMessage.senderId?._id || incomingMessage.senderId);
    const receiverId = String(incomingMessage.receiverId?._id || incomingMessage.receiverId);
    return isGroup
      ? messageConversationId === String(activeConversationId || selectedId)
      : senderId === selectedId || receiverId === selectedId || messageConversationId === String(activeConversationId);
  };

  const visibleMessages = [...messages, ...incomingMessages.filter(messageBelongsToSelectedConversation)]
    .filter((message, index, allMessages) => allMessages.findIndex((item) => String(item._id) === String(message._id)) === index)
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));

  useEffect(() => {
    const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
    console.log(`[frontend:chat:selected] selectedId=${selectedConversation?._id || "none"} type=${selectedConversation?.type || "direct"} activeConversationId=${activeConversationId || "none"} storedMessages=${messages.length} queuedMessages=${incomingMessages.length} visibleMessages=${visibleMessages.length} lastMessageId=${lastVisibleMessage?._id || "none"} lastMessageText=${lastVisibleMessage?.message || "none"}`);
  }, [selectedConversation?._id, selectedConversation?.type, activeConversationId, messages.length, incomingMessages.length, visibleMessages.length]);

  useEffect(() => {
    if (!socket || !activeConversationId) return undefined;
    socket.emit("joinConversation", { conversationId: activeConversationId });
    return () => socket.emit("leaveConversation", { conversationId: activeConversationId });
  }, [socket, activeConversationId]);

  useEffect(() => {
    if (!incomingMessages.length) return;
    const selectedUserId = String(selectedConversation?._id);
    const matchingMessages = incomingMessages.filter((incomingMessage) => {
      const matches = messageBelongsToSelectedConversation(incomingMessage);
      console.log(`[frontend:message:match] messageId=${incomingMessage._id} selectedId=${selectedUserId} activeConversationId=${activeConversationId} isGroup=${isGroup} matches=${matches}`);
      return matches;
    });
    if (!matchingMessages.length) return;
    const newMessages = matchingMessages.filter((incomingMessage) => !handledMessageIds.current.has(String(incomingMessage._id)));
    if (!newMessages.length) return;
    newMessages.forEach((incomingMessage) => handledMessageIds.current.add(String(incomingMessage._id)));
    const firstMessage = newMessages[0];
    if (!activeConversationId) setActiveConversationId(firstMessage.conversationId);
    newMessages.forEach((incomingMessage) => {
      const senderId = String(incomingMessage.senderId?._id || incomingMessage.senderId);
      if (senderId !== String(authUser?._id)) {
        new Audio(notify).play();
        socket?.emit("message:delivered", { messageId: incomingMessage._id });
        socket?.emit("message:read", { messageId: incomingMessage._id });
      }
    });
    setMessage((current) => {
      const currentIds = new Set(current.map((message) => String(message._id)));
      return [...current, ...newMessages.filter((message) => !currentIds.has(String(message._id)))];
    });
  }, [incomingMessages, socket, setMessage, activeConversationId, authUser?._id, selectedConversation?._id, isGroup]);

  useEffect(() => {
    const handleTyping = ({ conversationId, userId, typing }) => {
      if (String(conversationId) === String(activeConversationId) && String(userId) !== String(authUser?._id)) setTypingUser(typing);
    };
    socket?.on("typing", handleTyping);
    return () => socket?.off("typing", handleTyping);
  }, [socket, activeConversationId, authUser?._id]);

  useEffect(() => {
    const handleReceipt = ({ messageId, status }) => {
      setMessage((current) => current.map((message) => message._id === messageId
        ? { ...message, deliveryStatus: [...(message.deliveryStatus || []).filter((receipt) => receipt.userId !== authUser?._id), { userId: authUser?._id, status }] }
        : message));
    };
    socket?.on("messageReceipt", handleReceipt);
    return () => socket?.off("messageReceipt", handleReceipt);
  }, [socket, setMessage, authUser?._id]);

  useEffect(() => {
    const handleReaction = ({ messageId, userId, emoji }) => {
      setMessage((current) => current.map((message) => {
        if (message._id !== messageId) return message;
        const reactions = (message.reactions || []).filter((reaction) => String(reaction.userId?._id || reaction.userId) !== String(userId));
        return { ...message, reactions: [...reactions, { userId, emoji }] };
      }));
    };
    const handleReactionRemoved = ({ messageId, userId }) => {
      setMessage((current) => current.map((message) => message._id === messageId
        ? { ...message, reactions: (message.reactions || []).filter((reaction) => String(reaction.userId?._id || reaction.userId) !== String(userId)) }
        : message));
    };
    socket?.on("messageReaction", handleReaction);
    socket?.on("messageReactionRemoved", handleReactionRemoved);
    return () => {
      socket?.off("messageReaction", handleReaction);
      socket?.off("messageReactionRemoved", handleReactionRemoved);
    };
  }, [socket, setMessage]);

  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  useLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [visibleMessages.length]);

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      setMessage([]);
      console.log(`[frontend:history:start] endpoint=${isGroup ? "conversation" : "direct"} selectedId=${selectedConversation._id}`);
      try {
        const endpoint = isGroup ? `/api/message/conversation/${selectedConversation._id}?limit=30` : `/api/message/${selectedConversation._id}?limit=30`;
        const { data } = await axios.get(endpoint);
        console.log(`[frontend:history:response] conversationId=${data.conversationId || "none"} fetchedMessages=${data.messages?.length || 0} hasMore=${Boolean(data.hasMore)}`);
        setActiveConversationId(data.conversationId || (isGroup ? selectedConversation._id : null));
        setMessage((current) => {
          const fetchedMessages = data.messages || [];
          const fetchedIds = new Set(fetchedMessages.map((message) => message._id));
          const liveMessages = current.filter((message) => !fetchedIds.has(message._id));
          return [...fetchedMessages, ...liveMessages].sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
        });
        (data.messages || []).filter((message) => message.senderId !== authUser?._id).forEach((message) => socket?.emit("message:read", { messageId: message._id }));
      }
      catch (error) { console.error("[frontend:history:error]", error?.response?.data || error.message); }
      finally { setLoading(false); }
    };
    setTypingUser(false);
    setActiveConversationId(null);
    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, isGroup, setMessage, authUser?._id]);

  const handleInputChange = (event) => {
    setSendData(event.target.value);
    if (!activeConversationId || !socket) return;
    socket.emit("typing:start", { conversationId: activeConversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("typing:stop", { conversationId: activeConversationId }), 700);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sendData.trim()) return;
    setSending(true);
    try {
      const endpoint = isGroup ? `/api/message/conversation/${selectedConversation._id}/send` : `/api/message/send/${selectedConversation._id}`;
      const { data } = await axios.post(endpoint, { message: sendData });
      if (!activeConversationId && data.conversationId) setActiveConversationId(data.conversationId);
      setSendData(""); setMessage((current) => current.some((message) => message._id === data._id) ? current : [...current, data]);
      socket?.emit("typing:stop", { conversationId: data.conversationId || activeConversationId });
    } catch (error) { console.error(error); }
    finally { setSending(false); }
  };

  if (!selectedConversation) return <section className="flex flex-1 items-center justify-center p-8"><div className="max-w-sm text-center"><div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 ring-1 ring-white/10"><TiMessages className="text-5xl text-violet-200" /></div><p className="text-2xl font-semibold text-white">Welcome back, {authUser?.username}</p><p className="mt-3 text-sm leading-6 text-slate-400">Choose a conversation and turn a quiet moment into something meaningful.</p></div></section>;

  return <section className="flex h-full min-w-0 flex-1 flex-col">
    <header className="flex items-center gap-3 border-b border-white/10 bg-[#101932]/55 px-4 py-3.5 sm:px-6">
      <button onClick={onBackUser} aria-label="Back to messages" className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.07] text-slate-200 transition hover:bg-white/[.13] md:hidden"><IoArrowBackSharp /></button>
      <div className="relative"><img className="h-10 w-10 rounded-xl object-cover" src={isGroup ? (selectedConversation.avatar || authUser?.profilePic) : selectedConversation.profilePic} alt="" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#16213d] bg-emerald-400" /></div>
      <div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-white">{isGroup ? selectedConversation.name : selectedConversation.username}</h2><p className="text-xs text-emerald-300">{typingUser ? "Typing..." : isGroup ? `${selectedConversation.participants?.length || 0} members` : "Active now"}</p></div>
      <span className="hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs text-slate-400 sm:block">End-to-end vibes</span>
    </header>
    <div ref={messageListRef} className="scrollbar flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(124,92,255,.08),transparent_36rem)] px-4 py-5 sm:px-6">
      {loading && <div className="grid h-full place-items-center"><span className="loading loading-spinner text-violet-300" /></div>}
      {!loading && !visibleMessages.length && <div className="grid h-full place-items-center text-center text-sm text-slate-400"><div><span className="mb-3 block text-3xl">👋</span>Say hello and start the conversation.</div></div>}
      {!loading && visibleMessages.map((message) => {
        const mine = message.senderId === authUser._id || message.senderId?._id === authUser._id;
        const receipt = message.deliveryStatus?.find((status) => status.userId === authUser._id || status.userId?._id === authUser._id);
        return <div key={message._id} className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] sm:max-w-[68%] ${mine ? "items-end" : "items-start"} flex flex-col`}><div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-lg ${mine ? "rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-950/30" : "rounded-bl-md border border-white/10 bg-white/[.08] text-slate-100"}`}>{message.message || "Attachment"}</div><div className="flex items-center gap-2"><time className="mt-1.5 px-1 text-[10px] text-slate-500">{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}</time>{mine && <span className="text-[10px] text-slate-500">{receipt?.status || "sent"}</span>}<div className="flex gap-1">{["👍", "❤️", "😂"].map((emoji) => <button key={emoji} type="button" onClick={() => axios.put(`/api/message/${message._id}/reaction`, { emoji })} className="text-xs opacity-60 transition hover:scale-125 hover:opacity-100">{emoji}</button>)}</div></div>{message.reactions?.length > 0 && <div className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">{message.reactions.map((reaction) => reaction.emoji).join(" ")}</div>}</div></div>;
      })}
    </div>
    <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#101932]/60 p-3 sm:p-4"><div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.07] p-1.5 focus-within:border-violet-400/60"><input value={sendData} onChange={handleInputChange} id="message" type="text" placeholder="Write a message..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" /><button disabled={sending} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:opacity-60">{sending ? <span className="loading loading-spinner loading-sm" /> : <IoSend className="text-lg" />}</button></div></form>
  </section>;
};

export default MessageContainer;

