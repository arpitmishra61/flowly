import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import db from "@repo/db/client";
import "dotenv/config";

const app = express();
// Caddy sits in front of this service in production (see system-design.md
// §5) as a single reverse-proxy hop.
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3002;

// Per-zap token bucket so one noisy/misbehaving webhook source can't flood
// ZapRun inserts and starve other users' zaps downstream (sweeper/worker
// throughput is shared across everyone). Keyed on zapId, not IP — the
// caller here is an external SaaS product's servers, not a browser, so IP
// isn't a meaningful identity boundary.
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.params.zapId,
  message: { message: "Too many webhook calls for this zap, slow down" },
});

app.post("/hooks/catch/:userId/:zapId", webhookLimiter, async (req, res) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  // store in db a new trigger
  console.log("sfsf", zapId, body, userId);
  const run = await db.zapRun.create({
    data: {
      zapId: zapId,
      metadata: body,
    },
  });
  res.json({
    message: "Webhook received " + run.id,
    userId,
  });
});

app.listen(PORT, () => console.log("Hook is connected at PORT ", PORT));
