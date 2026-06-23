import { useEffect, useRef } from "react";
import io from "socket.io-client";
import toast from "react-hot-toast";

const WS_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useSocket(deviceId, callbacks = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const s = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    socketRef.current = s;

    s.on("connect", () => callbacks.onConnect?.());
    s.on("disconnect", (r) => callbacks.onDisconnect?.(r));
    s.on("connect_error", (err) => console.error("Socket error:", err.message));

    if (deviceId) {
      s.on("device:data", (d) => d.deviceId === deviceId && callbacks.onUpdate?.());
      s.on("device:data:update", (d) => d.deviceId === deviceId && callbacks.onUpdate?.());
      s.on("command:result", (d) => d.deviceId === deviceId && callbacks.onResult?.(d));
      s.on("command:sent", (d) => {
        if (d.deviceId === deviceId) {
          callbacks.onCommandSent?.(d);
          toast.success(`Sent: ${d.type}`);
        }
      });
      s.on("command:error", (d) => toast.error(`Command error: ${d.error}`));
    }

    return () => { s.close(); s.off(); };
  }, [deviceId]);

  const send = (type, params = {}) => {
    if (!socketRef.current?.connected) {
      toast.error("Socket disconnected");
      return;
    }
    socketRef.current.emit("command:send", { deviceId, type, params });
  };

  const sendImmediate = (type, params = {}) => {
    if (!socketRef.current?.connected) {
      toast.error("Socket disconnected");
      return;
    }
    socketRef.current.emit("command:send:immediate", { deviceId, type, params });
    return `> ${type} ${JSON.stringify(params)}`;
  };

  return { send, sendImmediate, socket: socketRef.current };
}