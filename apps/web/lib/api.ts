const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let cleanPath = path;
  if (!cleanPath.startsWith("/api/") && cleanPath !== "/api") {
    cleanPath = `/api${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
  }

  const res = await fetch(`${API_URL}${cleanPath}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path: string, token?: string) =>
    apiFetch(path, { method: "GET", token }),

  post: (path: string, body: unknown, token?: string) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body), token }),

  put: (path: string, body: unknown, token?: string) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body), token }),

  patch: (path: string, body: unknown, token?: string) =>
    apiFetch(path, { method: "PATCH", body: JSON.stringify(body), token }),

  delete: (path: string, token?: string) =>
    apiFetch(path, { method: "DELETE", token }),
};
