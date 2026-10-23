/**
 * The printed card's QR must point to a link guests can actually open.
 * Preview and local addresses are only reachable by the owner, so they never go on paper.
 */
export function isPublicOrigin(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === "localhost" || host.startsWith("127.") || host === "0.0.0.0") return false;
  if (host.includes("preview--")) return false;
  if (host.endsWith(".lovableproject.com")) return false;
  return true;
}

/** Profile link for the printed QR, or null when the app is not on a public address yet. */
export function printableProfileUrl(origin: string, masterId: string | null | undefined): string | null {
  if (!masterId || !isPublicOrigin(origin)) return null;
  return `${new URL(origin).origin}/m/${masterId}`;
}
