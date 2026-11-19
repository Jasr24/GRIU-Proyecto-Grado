const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, options = {}, session) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "No fue posible completar la solicitud");
  return body;
}
