import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiSmartphone,
  FiCode,
  FiTerminal,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiBell,
} from "react-icons/fi";

const navItems = [
  {
    path: "/",
    icon: FiGrid,
    label: "Dashboard",
    color: "from-blue-400 to-blue-600",
  },
  {
    path: "/devices",
    icon: FiSmartphone,
    label: "Devices",
    color: "from-purple-400 to-purple-600",
  },
  {
    path: "/apk-builder",
    icon: FiCode,
    label: "APK Builder",
    color: "from-green-400 to-green-600",
  },
  {
    path: "/terminal",
    icon: FiTerminal,
    label: "Terminal",
    color: "from-orange-400 to-orange-600",
    adminOnly: true,
  },
  {
    path: "/access-requests",
    icon: FiBell,
    label: "Access Requests",
    color: "from-red-400 to-red-600",
    adminOnly: true,
  },
  {
    path: "/settings",
    icon: FiSettings,
    label: "Settings",
    color: "from-gray-400 to-gray-600",
    adminOnly: true,
  },
];

export default function Layout({ children, onLogout, isAdmin = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
        bg-dark-800/95 backdrop-blur-xl border-r border-dark-700/50
      `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <FiShield className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">RAT Panel</h1>
            <p className="text-xs text-dark-400">Mobile Assessment Suite</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 text-white shadow-lg shadow-primary-500/5"
                      : "text-dark-300 hover:bg-dark-700/50 hover:text-white border border-transparent"
                  }
                `}
                >
                  <div
                    className={`
                  w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                  ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : "bg-dark-700 group-hover:bg-dark-600"
                  }
                `}
                  >
                    <Icon
                      className={`text-sm ${
                        isActive
                          ? "text-white"
                          : "text-dark-400 group-hover:text-white"
                      }`}
                    />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 glow-animation" />
                  )}
                </NavLink>
              );
            })}
        </nav>

        <div className="px-4 py-4 border-t border-dark-700/50">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-dark-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center group-hover:bg-red-500/20">
              <FiLogOut className="text-sm group-hover:text-red-400" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-dark-800/95 backdrop-blur-xl border-b border-dark-700/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <FiMenu className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <FiShield className="text-white text-xs" />
            </div>
            <span className="font-bold text-sm">RAT Panel</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
