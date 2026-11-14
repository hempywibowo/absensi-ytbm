import "server-only";
import { timingSafeEqual } from "crypto";

export function isAdmin(request) {
  const expected = process.env.ADMIN_KEY;
  const given = request.headers.get("x-admin-key") || "";
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
