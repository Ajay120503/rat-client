import { FiCopy } from "react-icons/fi";
import { copyToClipboard } from "../../hooks/useApi";

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-sm focus:outline-none focus:border-primary-500/50 w-64"
      />
    </div>
  );
}

export function RefreshBtn({ onClick, label = "Refresh" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all text-sm"
    >
      <svg
        className="w-4 h-4 animate-spin"
        style={{ animationDuration: "0s" }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {label}
    </button>
  );
}

export function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="text-center py-12 text-dark-400">
      {Icon && <Icon className="text-4xl mx-auto mb-3 opacity-50" />}
      <p>{message}</p>
      {action && (
        <button
          onClick={action}
          className="mt-4 text-sm text-primary-400 hover:text-primary-300"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function CopyBtn({ text }) {
  return (
    <button
      onClick={() => copyToClipboard(text)}
      className="p-1 rounded hover:bg-dark-600/50 text-dark-400"
      title="Copy"
    >
      <FiCopy className="text-xs" />
    </button>
  );
}

export function DeleteBtn({ onClick, size = "sm" }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all ${
        size === "sm" ? "p-1" : ""
      }`}
      title="Delete"
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
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

export function Section({ title, count, buttons, children }) {
  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {title}
          {count != null && ` (${count})`}
        </h3>
        <div className="flex gap-2">{buttons}</div>
      </div>
      {children}
    </div>
  );
}
