/**
 * Profile scoping. Currently pinned to a single shared profile — everyone
 * sees the same log. To bring back per-device profiles (no auth), read the
 * `anna_device` cookie here and re-enable ensureDeviceId() in the dashboard:
 *
 *   import { cookies } from "next/headers";
 *   const raw = (await cookies()).get("anna_device")?.value ?? "";
 *   return /^[A-Za-z0-9-]{1,64}$/.test(raw) ? raw : "default";
 */
export async function getDeviceId(): Promise<string> {
  return "default";
}
