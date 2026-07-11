import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.post("/google-secret", async (req, res) => {
  const { email, googleSecret } = req.body as {
    email?: string;
    googleSecret?: string;
  };

  if (!email || !googleSecret) {
    return res
      .status(400)
      .json({ success: false, message: "email and googleSecret are required" });
  }

  try {
    const user = await db.user.update({
      where: { email },
      data: { googleSecret },
    });
    res.json({ success: true, email: user.email });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(404).json({ success: false, message: "User not found" });
  }
});

router.get("/google-secret/status", async (req, res) => {
  const { email } = req.query as { email?: string };

  if (!email) {
    return res.status(400).json({ success: false, message: "email is required" });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { googleSecret: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, configured: !!user.googleSecret });
});

export default router;
