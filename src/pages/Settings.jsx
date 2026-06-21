import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FiSave,
  FiKey,
  FiServer,
  FiBell,
  FiShield,
  FiGlobe,
  FiLock,
} from "react-icons/fi";

export default function Settings() {
  const [settings, setSettings] = useState({
    serverUrl: localStorage.getItem("server_url") || "http://localhost:5000",
    wsUrl: localStorage.getItem("ws_url") || "http://localhost:5000",
    apiKey: localStorage.getItem("api_key") || "",
    notifications: {
      deviceOnline: true,
      deviceOffline: true,
      commandResult: false,
      dataReceived: true,
    },
    security: {
      sessionTimeout: "60",
      maxDevices: "100",
      encryptData: true,
      logCommands: true,
    },
  });

  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    localStorage.setItem("server_url", settings.serverUrl);
    localStorage.setItem("ws_url", settings.wsUrl);
    localStorage.setItem("api_key", settings.apiKey);
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-dark-400 mt-1">Configure your RAT panel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Configuration */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiServer className="text-primary-400" />
            Server Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                API Server URL
              </label>
              <input
                type="text"
                value={settings.serverUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    serverUrl: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
                placeholder="http://localhost:5000"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                WebSocket URL
              </label>
              <input
                type="text"
                value={settings.wsUrl}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, wsUrl: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
                placeholder="http://localhost:5000"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
                  placeholder="your-api-key"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-dark-300 hover:text-white transition-all"
                >
                  <FiKey />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiBell className="text-primary-400" />
            Notifications
          </h3>

          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all cursor-pointer"
              >
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div
                  className={`w-12 h-6 rounded-full transition-all ${
                    value ? "bg-primary-500" : "bg-dark-600"
                  } relative`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      value ? "left-6" : "left-0.5"
                    }`}
                  />
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: !value },
                      }))
                    }
                    className="hidden"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiShield className="text-primary-400" />
            Security
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    security: {
                      ...prev.security,
                      sessionTimeout: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Max Connected Devices
              </label>
              <input
                type="number"
                value={settings.security.maxDevices}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    security: { ...prev.security, maxDevices: e.target.value },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-primary-500/50"
              />
            </div>
            {Object.entries({
              encryptData: "Encrypt Data in Transit",
              logCommands: "Log All Commands",
            }).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700/50 transition-all cursor-pointer"
              >
                <span className="text-sm">{label}</span>
                <div
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.security[key] ? "bg-primary-500" : "bg-dark-600"
                  } relative`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      settings.security[key] ? "left-6" : "left-0.5"
                    }`}
                  />
                  <input
                    type="checkbox"
                    checked={settings.security[key]}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          [key]: !settings.security[key],
                        },
                      }))
                    }
                    className="hidden"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiGlobe className="text-primary-400" />
            About
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-700/30">
              <p className="text-sm text-dark-300">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-700/30">
              <p className="text-sm text-dark-300">Framework</p>
              <p className="font-medium">MERN Stack + Tailwind CSS</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-700/30">
              <p className="text-sm text-dark-300">Platform</p>
              <p className="font-medium">Android (API 26+) · Kotlin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-2"
        >
          <FiSave />
          Save Settings
        </button>
      </div>
    </div>
  );
}
