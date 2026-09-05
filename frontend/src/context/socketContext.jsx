import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [messageEvents, setMessageEvents] = useState([]);
  const { authUser } = useAuth();
  useEffect(() => {
    if (authUser) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin);
      const socket = io(socketUrl, {
        query: {
          userId: authUser?._id,
        },
        withCredentials: true,
        reconnection: true,
      });
      socket.on("connect", () => console.log(`[frontend:socket:connected] socketId=${socket.id} url=${socketUrl} userId=${authUser?._id}`));
      socket.on("disconnect", (reason) => console.warn(`[frontend:socket:disconnected] reason=${reason}`));
      socket.onAny((event, payload) => {
        console.log(`[frontend:socket:event] event=${event}`, payload);
        if (event === "messageUpdated" || event === "messageDeleted") {
          setMessageEvents((current) => [...current.slice(-49), { type: event, payload }]);
          return;
        }
        if (event !== "newMessage") return;
        console.log(`[frontend:socket:newMessage] messageId=${payload?._id} conversationId=${payload?.conversationId} senderId=${payload?.senderId} receiverId=${payload?.receiverId}`);
        setIncomingMessages((current) => {
          const next = [...current.slice(-49), payload];
          console.log(`[frontend:socket:queue] previous=${current.length} next=${next.length} messageId=${payload?._id}`);
          return next;
        });
      });
      socket.on("getOnlineUsers", (users) => {
        setOnlineUser(users);
      });
      socket.on("connect_error", (error) => console.error("Socket connection error:", error.message));
      setSocket(socket);
      return () => {
        socket.removeAllListeners();
        socket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);
  return (
    <SocketContext.Provider value={{ socket, onlineUser, incomingMessages, messageEvents }}>
      {children}
    </SocketContext.Provider>
  );
};

