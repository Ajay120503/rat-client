export function StatusBadge({ status }) {
  const online = status === "online";
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
        online
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-dark-600/50 text-dark-400 border border-dark-600/30"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          online ? "bg-green-400 animate-pulse" : "bg-dark-500"
        }`}
      />
      {status}
    </span>
  );
}

export function InfoGrid({ device }) {
  const items = [
    {
      label: "Model",
      value: `${device.manufacturer || ""} ${device.deviceModel || ""}`,
    },
    { label: "OS", value: `${device.os || ""} ${device.osVersion || ""}` },
    { label: "IP", value: device.ip || "Unknown" },
    { label: "Country", value: device.country || "Unknown" },
    { label: "City", value: device.city || "Unknown" },
    {
      label: "Battery",
      value:
        device.batteryLevel != null ? `${device.batteryLevel}%` : "Unknown",
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
    { label: "APK", value: device.apkVersion || "Unknown" },
  ];
  return (
    <div className="lg:col-span-2 glass-effect rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Device Information</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <div key={i.label} className="p-3 rounded-xl bg-dark-700/30">
            <p className="text-xs text-dark-400">{i.label}</p>
            <p className="font-medium mt-0.5 truncate">{i.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PermissionsPanel({ permissions }) {
  const items = [
    { key: "camera", label: "Camera", color: "text-blue-400" },
    { key: "location", label: "Location", color: "text-red-400" },
    { key: "sms", label: "SMS", color: "text-green-400" },
    { key: "contacts", label: "Contacts", color: "text-purple-400" },
    { key: "storage", label: "Storage", color: "text-yellow-400" },
    { key: "microphone", label: "Mic", color: "text-orange-400" },
    { key: "phone", label: "Phone", color: "text-cyan-400" },
    { key: "notifications", label: "Notif", color: "text-pink-400" },
  ];
  return (
    <div className="glass-effect rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Permissions</h3>
      <div className="space-y-3">
        {items.map((p) => (
          <div
            key={p.key}
            className="flex items-center justify-between p-2 rounded-lg bg-dark-700/30"
          >
            <span className="text-sm">{p.label}</span>
            <span
              className={`text-xs ${
                permissions?.[p.key] ? "text-green-400" : "text-dark-500"
              }`}
            >
              {permissions?.[p.key] ? "Granted" : "N/A"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentCommands({ commands }) {
  const failed = commands.filter((c) => c.status === "failed").length;
  return (
    <div className="lg:col-span-3 glass-effect rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">
        Recent Commands
        {failed > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
            {failed} failed
          </span>
        )}
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!commands.length ? (
          <p className="text-dark-400 text-center py-8">No commands yet</p>
        ) : (
          commands.map((cmd, i) => {
            const hasErr =
              cmd.status === "failed" &&
              cmd.result &&
              (cmd.result.error || cmd.result.errorType);
            return (
              <div key={cmd.commandId || i}>
                <div
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    hasErr
                      ? "bg-red-900/20 border border-red-500/20"
                      : "bg-dark-700/30"
                  }`}
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
                    {hasErr && (
                      <span className="text-xs text-red-400">
                        {cmd.result.errorType || "Error"}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      cmd.status === "failed" ? "text-red-400" : "text-dark-400"
                    }`}
                  >
                    {cmd.status}
                  </span>
                </div>
                {hasErr && (
                  <div className="mt-1 mb-2 ml-5 p-3 rounded-lg bg-red-950/40 border border-red-500/10">
                    <p className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                      <span className="text-red-400 font-bold">Error:</span>{" "}
                      {cmd.result.error}
                    </p>
                    {cmd.result.stackTrace && (
                      <details className="mt-1">
                        <summary className="text-xs text-red-400/60 cursor-pointer">
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
  );
}

export default function OverviewTab({ device, commands }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <InfoGrid device={device} />
      <PermissionsPanel permissions={device.permissions} />
      <RecentCommands commands={commands} />
    </div>
  );
}
