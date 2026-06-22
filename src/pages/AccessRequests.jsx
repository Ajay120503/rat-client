import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiBell,
  FiCheckCircle,
  FiX,
  FiUser,
  FiSmartphone,
  FiClock,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/access-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      // silently fail - user might not be admin
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/access-requests/${requestId}`,
        { action: "approve" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Access request approved");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/access-requests/${requestId}`,
        { action: "reject" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Access request rejected");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-dark-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Requests</h1>
          <p className="text-dark-400 mt-1">
            Manage device access requests from other users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiBell className="text-orange-400" />
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm">
            {requests.length} pending
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="glass-effect rounded-2xl p-12 text-center">
          <FiBell className="text-5xl mx-auto mb-4 text-dark-500" />
          <p className="text-dark-400 text-lg">No pending requests</p>
          <p className="text-dark-500 text-sm mt-2">
            When users request access to your devices, they will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="glass-effect rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-primary-400 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg">
                      {req.requesterUsername}
                    </p>
                    <p className="text-sm text-dark-400 mt-1">
                      wants access to{" "}
                      <span className="text-primary-400">
                        {req.deviceModel}
                      </span>
                    </p>
                    {req.message && (
                      <div className="mt-3 p-3 rounded-xl bg-dark-700/30">
                        <p className="text-sm text-dark-300 italic">
                          "{req.message}"
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <FiClock />
                        {new Date(req.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => approveRequest(req._id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all text-sm"
                  >
                    <FiCheckCircle />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(req._id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <FiX />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
