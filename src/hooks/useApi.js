import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const headers = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const handleError = (err, msg = "Operation failed") => {
  const detail = err.response?.data?.error || err.message;
  toast.error(`${msg}: ${detail}`);
  return null;
};

export async function fetchDevice(deviceId) {
  try {
    const res = await axios.get(`${API}/api/devices/${deviceId}`, headers());
    return res.data;
  } catch (err) {
    return handleError(err, "Failed to load device");
  }
}

export async function deleteDevice(deviceId) {
  try {
    await axios.delete(`${API}/api/devices/${deviceId}`, headers());
    toast.success("Device deleted");
    return true;
  } catch (err) {
    return handleError(err, "Delete failed");
  }
}

export async function deleteMedia(deviceId, type, publicId) {
  if (!publicId) { toast.error("No publicId to delete"); return false; }
  try {
    await axios.delete(`${API}/api/media/${deviceId}/${type}`, {
      ...headers(),
      data: { publicId },
    });
    toast.success("Deleted");
    return true;
  } catch (err) {
    return handleError(err, "Delete failed");
  }
}

export async function deleteAllMedia(deviceId, type) {
  try {
    await axios.delete(`${API}/api/media/${deviceId}/${type}`, headers());
    toast.success("All deleted");
    return true;
  } catch (err) {
    return handleError(err, "Delete failed");
  }
}

export async function deleteDataType(deviceId, dataType, label) {
  try {
    await axios.delete(`${API}/api/devices/${deviceId}/data/${dataType}`, headers());
    toast.success(`All ${label} deleted`);
    return true;
  } catch (err) {
    return handleError(err, "Delete failed");
  }
}

export async function deleteDataItem(deviceId, dataType, itemId) {
  if (!itemId) { toast.error("No item ID to delete"); return false; }
  try {
    await axios.delete(`${API}/api/devices/${deviceId}/data/${dataType}/${encodeURIComponent(itemId)}`, headers());
    toast.success("Item deleted");
    return true;
  } catch (err) {
    return handleError(err, "Delete failed");
  }
}

export function openInMaps(lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
}