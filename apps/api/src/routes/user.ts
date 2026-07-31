import db from "@repo/db/client";
import express from "express";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { userLimiter } from "../middleware/rateLimit";
const router = express.Router();

router.use(requireAuth);
router.use(userLimiter);

router.post("/google-secret", async (req: AuthedRequest, res) => {
  const { googleSecret } = req.body as { googleSecret?: string };

  if (!googleSecret) {
    return res
      .status(400)
      .json({ success: false, message: "googleSecret is required" });
  }

  try {
    const user = await db.user.update({
      where: { email: req.userEmail },
      data: { googleSecret },
    });
    res.json({ success: true, email: user.email });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(404).json({ success: false, message: "User not found" });
  }
});

router.get("/google-secret/status", async (req: AuthedRequest, res) => {
  const user = await db.user.findUnique({
    where: { email: req.userEmail },
    select: { googleSecret: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, configured: !!user.googleSecret });
});

router.post("/github-token", async (req: AuthedRequest, res) => {
  const { githubToken } = req.body as { githubToken?: string };

  if (!githubToken) {
    return res
      .status(400)
      .json({ success: false, message: "githubToken is required" });
  }

  try {
    const user = await db.user.update({
      where: { email: req.userEmail },
      data: { githubToken },
    });
    res.json({ success: true, email: user.email });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(404).json({ success: false, message: "User not found" });
  }
});

router.get("/github-token/status", async (req: AuthedRequest, res) => {
  const user = await db.user.findUnique({
    where: { email: req.userEmail },
    select: { githubToken: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, configured: !!user.githubToken });
});

router.post("/hook-id", async (req: AuthedRequest, res) => {
  const { hookId } = req.body as { hookId?: string };

  if (!hookId) {
    return res
      .status(400)
      .json({ success: false, message: "hookId is required" });
  }

  try {
    const user = await db.user.update({
      where: { email: req.userEmail },
      data: { hookId },
    });
    res.json({ success: true, email: user.email, hookId: user.hookId });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(404).json({ success: false, message: "User not found" });
  }
});

router.get("/hook-id", async (req: AuthedRequest, res) => {
  const user = await db.user.findUnique({
    where: { email: req.userEmail },
    select: { id: true, hookId: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, userId: user.id, hookId: user.hookId });
});

export default router;
