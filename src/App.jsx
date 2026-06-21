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
import Layout from "./components/Layout";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

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
      <Layout onLogout={() => setToken(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:deviceId" element={<DeviceDetails />} />
          <Route path="/apk-builder" element={<ApkBuilder />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
