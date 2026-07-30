import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("token");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit("join:conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketRef.current?.emit("leave:conversation", conversationId);
  }, []);

  const sendTypingStart = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit("typing:start", { conversationId, receiverId });
  }, []);

  const sendTypingStop = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit("typing:stop", { conversationId, receiverId });
  }, []);

  const onMessage = useCallback((handler) => {
    socketRef.current?.on("message:new", handler);
    return () => socketRef.current?.off("message:new", handler);
  }, []);

  const onTypingStart = useCallback((handler) => {
    socketRef.current?.on("typing:start", handler);
    return () => socketRef.current?.off("typing:start", handler);
  }, []);

  const onTypingStop = useCallback((handler) => {
    socketRef.current?.on("typing:stop", handler);
    return () => socketRef.current?.off("typing:stop", handler);
  }, []);

  const clearNotificationCount = useCallback(() => setUnreadCount(0), []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      notifications,
      unreadCount,
      joinConversation,
      leaveConversation,
      sendTypingStart,
      sendTypingStop,
      onMessage,
      onTypingStart,
      onTypingStop,
      clearNotificationCount
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
