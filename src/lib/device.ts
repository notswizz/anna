import { cookies } from "next/headers";

/**
 * No-auth device identity: the client mints a UUID, keeps it in
 * localStorage, and mirrors it into the `anna_device` cookie so every
 * API call is scoped to this device's own profile and log.
 */
export async function getDeviceId(): Promise<string> {
  const jar = await cookies();
  const raw = jar.get("anna_device")?.value ?? "";
  return /^[A-Za-z0-9-]{1,64}$/.test(raw) ? raw : "default";
}
