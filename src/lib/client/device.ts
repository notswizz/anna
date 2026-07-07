const KEY = "anna_device";

/** Mint (or recall) this device's ID and mirror it into a cookie for the API. */
export function ensureDeviceId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(KEY);
  } catch {
    // storage blocked — cookie alone will have to do
  }
  if (!id || !/^[A-Za-z0-9-]{1,64}$/.test(id)) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }
  // ~2 years
  document.cookie = `${KEY}=${id}; path=/; max-age=63072000; SameSite=Lax`;
  return id;
}
