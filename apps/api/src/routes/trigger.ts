import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  const availTriggers = await db.availableTrigger.findMany();
  res.json(availTriggers);
});

export default router;
