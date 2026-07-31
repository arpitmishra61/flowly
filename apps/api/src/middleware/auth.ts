import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export interface AuthedRequest extends Request {
  userId?: number;
  userEmail?: string;
}

interface InternalTokenPayload {
  sub: string;
  email: string;
}

// Verifies a short-lived JWT minted server-side by apps/web on behalf of the
// signed-in user (see apps/web/lib/apiToken.ts). The caller's identity is
// taken from the verified token only — request body/query values are never
// trusted for identity.
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!INTERNAL_API_SECRET) {
    console.error("INTERNAL_API_SECRET is not configured");
    return res.status(500).json({ success: false, message: "Server misconfigured" });
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ success: false, message: "Missing Authorization token" });
  }

  try {
    const payload = jwt.verify(token, INTERNAL_API_SECRET) as InternalTokenPayload;
    const userId = Number(payload.sub);
    if (!payload.sub || Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.userId = userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
