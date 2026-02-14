import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  const availActions = await db.availableAction.findMany();
  res.json(availActions);
});

export default router;
