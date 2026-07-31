import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AuthedRequest } from "./auth";

// Baseline abuse/DoS guard applied to every request, including the
// unauthenticated public catalog routes (actions/triggers) — keyed by IP
// since there's no verified identity yet at this point.
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for authenticated per-user routes (zap/user/contact
// CRUD). Keyed by the verified userId from requireAuth (which always runs
// first on these routers) so one user's usage can't starve another's.
export const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthedRequest) => req.userId?.toString() ?? ipKeyGenerator(req.ip ?? ""),
});

// The AI chat endpoint hits an external LLM call plus forwards to apps/hook
// per request — meaningfully more expensive than a CRUD call, so it gets a
// tighter budget than userLimiter.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthedRequest) => req.userId?.toString() ?? ipKeyGenerator(req.ip ?? ""),
});
