const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000";

let deviceId: string | null = null;

export function setDeviceId(id: string) {
  deviceId = id;
}

export function getDeviceId(): string | null {
  return deviceId;
}

export async function registerNode(params: {
  storeId: string;
  name: string;
  platform: string;
  fcmToken?: string;
  firmwareVersion?: string;
}) {
  const res = await fetch(`${API_URL}/api/edge-nodes/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer edge-node" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  const data = await res.json();
  deviceId = data.node.id;
  return data.node;
}

export async function sendHeartbeat() {
  if (!deviceId) return;
  await fetch(`${API_URL}/api/edge-nodes/${deviceId}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer edge-node" },
  });
}

export async function fetchCommand() {
  if (!deviceId) return null;
  const res = await fetch(`${API_URL}/api/sync/status?storeId=all`, {
    headers: { Authorization: "Bearer edge-node" },
  });
  if (!res.ok) return null;
  return res.json();
}
