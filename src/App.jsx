import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/DeviceDetails";
import ApkBuilder from "./pages/ApkBuilder";
import Terminal from "./pages/Terminal";
import Settings from "./pages/Settings";
import AccessRequests from "./pages/AccessRequests";
import Layout from "./components/Layout";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || "user"
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserRole();
    }
  }, [token]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role || "user");
        localStorage.setItem("userRole", data.role || "user");
      }
    } catch (err) {
      // silently fail
    }
  };

  const isAdmin = userRole === "admin" || userRole === "superadmin";

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={setToken} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Layout
        onLogout={() => setToken(null)}
        userRole={userRole}
        isAdmin={isAdmin}
      >
        <Routes>
          <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
          <Route path="/devices" element={<Devices isAdmin={isAdmin} />} />
          <Route
            path="/devices/:deviceId"
            element={<DeviceDetails isAdmin={isAdmin} />}
          />
          <Route path="/apk-builder" element={<ApkBuilder />} />
          {isAdmin && <Route path="/terminal" element={<Terminal />} />}
          {isAdmin && (
            <Route path="/access-requests" element={<AccessRequests />} />
          )}
          {isAdmin && <Route path="/settings" element={<Settings />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
