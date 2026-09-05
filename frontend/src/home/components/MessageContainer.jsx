import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TiMessages } from "react-icons/ti";
import { IoArrowBackSharp, IoSend } from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaReply } from "react-icons/fa6";
import axios from "axios";
import userConversation from "../../Zustans/useConversation";
import { useAuth } from "../../context/AuthContext";
import { useSocketContext } from "../../context/socketContext.jsx";
import notify from "../../assets/sound/notification.mp3";
import Avatar from "../../components/Avatar.jsx";

const MessageContainer = ({ onBackUser }) => {
  const { messages, setMessage, selectedConversation } = userConversation();
  const { socket, incomingMessages, messageEvents } = useSocketContext();
  const { authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendData, setSendData] = useState("");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [typingUser, setTypingUser] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
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

  useEffect(() => {
    messageEvents.forEach(({ type, payload }) => {
      if (type === "messageUpdated") {
        setMessage((current) => current.map((message) => message._id === payload._id ? { ...message, ...payload } : message));
      }
      if (type === "messageDeleted") {
        setMessage((current) => current.map((message) => message._id === payload.messageId ? { ...message, message: "", attachment: undefined, deletedAt: payload.deletedAt } : message));
      }
    });
  }, [messageEvents, setMessage]);

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
    setShowMembers(false);
    setReplyMessage(null);
    setEditingMessage(null);
    setSendData("");
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
      if (editingMessage) {
        const { data } = await axios.patch(`/api/message/${editingMessage._id}`, { message: sendData });
        setMessage((current) => current.map((message) => message._id === data._id ? { ...message, ...data } : message));
        setEditingMessage(null);
        setSendData("");
        return;
      }
      const endpoint = isGroup ? `/api/message/conversation/${selectedConversation._id}/send` : `/api/message/send/${selectedConversation._id}`;
      const { data } = await axios.post(endpoint, { message: sendData, replyTo: replyMessage?._id });
      if (!activeConversationId && data.conversationId) setActiveConversationId(data.conversationId);
      setSendData(""); setReplyMessage(null); setMessage((current) => current.some((message) => message._id === data._id) ? current : [...current, data]);
      socket?.emit("typing:stop", { conversationId: data.conversationId || activeConversationId });
    } catch (error) { console.error(error); }
    finally { setSending(false); }
  };

  const sendReaction = async (messageId, emoji) => {
    setReactionPickerFor(null);
    try { await axios.put(`/api/message/${messageId}/reaction`, { emoji }); }
    catch (error) { console.error(error); }
  };

  const startEdit = (message) => { setEditingMessage(message); setReplyMessage(null); setSendData(message.message || ""); };
  const deleteMessage = async (message) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`/api/message/${message._id}`);
      setMessage((current) => current.map((item) => item._id === message._id ? { ...item, message: "", attachment: undefined, deletedAt: new Date().toISOString() } : item));
    } catch (error) { console.error(error); }
  };

  if (!selectedConversation) return (
    <section className="flex flex-1 items-center justify-center p-8">
      <div className="animate-rise max-w-sm text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 ring-1 ring-white/10">
          <TiMessages className="text-5xl text-violet-200" />
        </div>
        <p className="font-display text-2xl font-semibold text-white">Welcome back, {authUser?.username}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">Choose a conversation and turn a quiet moment into something meaningful.</p>
      </div>
    </section>
  );

  return <section className="flex h-full min-w-0 flex-1 flex-col">
    <header className="theme-surface relative flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
      <button onClick={onBackUser} aria-label="Back to messages" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.07] text-slate-200 transition hover:bg-white/[.13] lg:hidden"><IoArrowBackSharp /></button>
      <Avatar
        src={isGroup ? (selectedConversation.avatar || authUser?.profilePic) : selectedConversation.profilePic}
        name={isGroup ? selectedConversation.name : selectedConversation.username}
        size={10}
        online={!isGroup}
        className="rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-white">{isGroup ? selectedConversation.name : selectedConversation.username}</h2>
        <p className="flex items-center gap-1.5 text-xs text-emerald-300">
          {typingUser ? (
            <span className="flex items-center gap-1">
              typing
              <span className="flex gap-0.5">
                <span className="typing-dot h-1 w-1 rounded-full bg-emerald-300" style={{ animationDelay: "0s" }} />
                <span className="typing-dot h-1 w-1 rounded-full bg-emerald-300" style={{ animationDelay: ".15s" }} />
                <span className="typing-dot h-1 w-1 rounded-full bg-emerald-300" style={{ animationDelay: ".3s" }} />
              </span>
            </span>
          ) : isGroup ? `${selectedConversation.participants?.length || 0} members` : "Active now"}
        </p>
      </div>
      {isGroup && <button type="button" onClick={() => setShowMembers((current) => !current)} aria-label="Show group members" aria-pressed={showMembers} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.07] text-slate-200 transition hover:bg-white/[.13]"><FaUsers /></button>}
      {isGroup && showMembers && (
        <div className="theme-surface animate-pop absolute right-3 top-14 z-10 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-2xl sm:right-4 sm:top-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Group members</p>
          <div className="scrollbar max-h-56 space-y-2 overflow-y-auto">
            {(selectedConversation.participants || []).map((participant) => {
              const memberName = participant.username || participant.fullname || String(participant);
              const memberId = participant._id || participant;
              return (
                <div key={memberId} className="flex items-center gap-2">
                  <Avatar src={participant.profilePic} name={memberName} size={8} className="rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{String(memberId) === String(authUser?._id) ? "You" : memberName}</p>
                    {selectedConversation.admins?.some((admin) => String(admin?._id || admin) === String(memberId)) && <p className="text-[10px] text-violet-300">Admin</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>

    <div ref={messageListRef} className="theme-canvas scrollbar min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,128,108,.07),transparent_36rem)] px-3 py-4 sm:px-6 sm:py-5">
      {loading && <div className="grid h-full place-items-center"><span className="loading loading-spinner text-violet-300" /></div>}
      {!loading && !visibleMessages.length && (
        <div className="grid h-full place-items-center text-center text-sm text-slate-400">
          <div><span className="mb-3 block text-3xl">👋</span>Say hello and start the conversation.</div>
        </div>
      )}
      {!loading && visibleMessages.map((message) => {
        const mine = message.senderId === authUser._id || message.senderId?._id === authUser._id;
        const sender = typeof message.senderId === "object" ? message.senderId : selectedConversation.participants?.find((participant) => String(participant._id || participant) === String(message.senderId));
        const senderName = sender?._id === authUser?._id ? "You" : sender?.username || sender?.fullname;
        const receipt = message.deliveryStatus?.find((status) => status.userId === authUser._id || status.userId?._id === authUser._id);
        const replyPreview = message.replyTo && (message.replyTo.message || "Deleted message");
        const reactionGroups = Object.values(
          (message.reactions || []).reduce((groups, reaction) => {
            const key = reaction.emoji;
            if (!groups[key]) groups[key] = { emoji: key, count: 0 };
            groups[key].count += 1;
            return groups;
          }, {})
        );
        const hasReactions = reactionGroups.length > 0;
        const pickerOpen = reactionPickerFor === message._id;
        return (
          <div key={message._id} className={`msg-row group relative mb-4 flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[82%] flex-col sm:max-w-[68%] ${mine ? "items-end" : "items-start"}`}>
              {isGroup && <span className="mb-1 px-1 text-[11px] font-semibold text-violet-300">{senderName || "Group member"}</span>}
              {replyPreview && <div className="mb-1 max-w-full truncate rounded-lg border-l-2 border-violet-300/60 bg-black/10 px-2 py-1 text-xs text-slate-400">Replying to: {replyPreview}</div>}

              {/* Bubble + toolbar + overlapping reaction pill live in one relative wrapper
                  so the reaction chip can sit tucked into the bubble's corner instead of
                  pushing a whole extra row underneath the message. */}
              <div className={`relative ${hasReactions ? "mb-2.5" : ""}`}>
                <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-lg ${mine ? "rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-950/30" : "rounded-bl-md border border-white/10 bg-white/[.08] text-slate-100"}`}>
                    {message.deletedAt ? <em className="text-slate-400">Message deleted</em> : message.message || "Attachment"}
                  </div>

                  {/* Hover toolbar: a compact pill beside the bubble, never overlapping text */}
                  {!message.deletedAt && (
                    <div className="msg-actions relative flex items-center gap-0.5 rounded-full border border-white/10 bg-[var(--surface-strong)] px-1 py-1 shadow-md">
                      <button type="button" onClick={() => setReplyMessage(message)} aria-label="Reply to message" className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-white"><FaReply /></button>
                      <button type="button" onClick={() => setReactionPickerFor((current) => current === message._id ? null : message._id)} aria-label="Add reaction" aria-expanded={pickerOpen} className="grid h-6 w-6 place-items-center rounded-full text-xs text-slate-400 transition hover:bg-white/10 hover:text-white">🙂</button>
                      {mine && (
                        <>
                          <button type="button" onClick={() => startEdit(message)} aria-label="Edit message" className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-white"><FiEdit2 /></button>
                          <button type="button" onClick={() => deleteMessage(message)} aria-label="Delete message" className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300"><FiTrash2 /></button>
                        </>
                      )}

                      {pickerOpen && (
                        <div className={`theme-surface animate-pop absolute -top-11 z-10 flex items-center gap-1 rounded-full border px-1.5 py-1 shadow-xl ${mine ? "right-0" : "left-0"}`}>
                          {["👍", "❤️", "😂", "🎉", "😮"].map((emoji) => (
                            <button key={emoji} type="button" onClick={() => sendReaction(message._id, emoji)} className="grid h-7 w-7 place-items-center rounded-full text-sm transition hover:scale-125 hover:bg-white/10">{emoji}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reaction summary: a small pill tucked into the bubble's bottom corner */}
                {hasReactions && (
                  <div className={`absolute -bottom-3 flex items-center gap-0.5 rounded-full border border-white/15 bg-[var(--surface-strong)] px-1.5 py-0.5 text-[11px] shadow-md ${mine ? "right-2" : "left-2"}`}>
                    {reactionGroups.map((group) => (
                      <span key={group.emoji} className="flex items-center gap-0.5">
                        {group.emoji}
                        {group.count > 1 && <span className="text-[10px] text-slate-400">{group.count}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 px-1">
                <time className="text-[10px] text-slate-500">{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}</time>
                {mine && !message.deletedAt && <span className="text-[10px] capitalize text-slate-500">· {receipt?.status || "sent"}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <form onSubmit={handleSubmit} className="theme-surface shrink-0 border-t border-white/10 p-2.5 sm:p-4">
      {(replyMessage || editingMessage) && (
        <div className="animate-rise mb-2 flex items-center justify-between gap-3 rounded-xl border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-xs text-slate-300">
          <span className="truncate">{editingMessage ? "Editing message" : `Replying to: ${replyMessage?.message || "Deleted message"}`}</span>
          <button type="button" onClick={() => { setReplyMessage(null); setEditingMessage(null); setSendData(""); }} className="shrink-0 text-slate-400 hover:text-white">Cancel</button>
        </div>
      )}
      <div className="theme-input flex items-center gap-2 rounded-2xl border p-1.5 focus-within:border-violet-400/60">
        <input
          value={sendData}
          onChange={handleInputChange}
          id="message"
          type="text"
          placeholder={editingMessage ? "Edit your message..." : "Write a message..."}
          className="min-w-0 flex-1 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <button
          disabled={sending || !sendData.trim()}
          aria-label={editingMessage ? "Save edited message" : "Send message"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-[#241014] transition hover:-translate-y-0.5 hover:bg-violet-400 disabled:pointer-events-none disabled:opacity-40"
        >
          {sending ? <span className="loading loading-spinner loading-sm" /> : <IoSend className="text-lg" />}
        </button>
      </div>
    </form>
  </section>;
};

export default MessageContainer;

