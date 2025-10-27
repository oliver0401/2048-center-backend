import { Request } from "express";

export type OSType = "Windows" | "MacOS" | "Linux" | "iOS" | "Android" | "Unknown";

/**
 * Detect OS from User-Agent header
 * @param req - Express Request object
 * @returns OS type string
 */
export const detectOSFromUserAgent = (req: Request): OSType => {
  const userAgent = req.headers["user-agent"] || "";

  // Windows detection
  if (/Windows NT 10/i.test(userAgent)) return "Windows";
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Win64|Win32|WOW64/i.test(userAgent)) return "Windows";

  // macOS detection
  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(userAgent)) return "MacOS";

  // iOS detection
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";

  // Android detection
  if (/Android/i.test(userAgent)) return "Android";

  // Linux detection (should come after Android as Android also contains Linux)
  if (/Linux/i.test(userAgent)) return "Linux";

  return "Unknown";
};

/**
 * Get OS from request body or detect from User-Agent
 * @param req - Express Request object
 * @returns OS type string
 */
export const getOSFromRequest = (req: Request): OSType => {
  // First, try to get OS from request body (client-side detection)
  if (req.body.os) {
    return req.body.os as OSType;
  }

  // Fallback to User-Agent parsing (server-side detection)
  return detectOSFromUserAgent(req);
};

