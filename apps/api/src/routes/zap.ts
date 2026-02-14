import express from "express";
import { ZapCreateSchema } from "../types/main";
import db from "@repo/db/client";

const router = express.Router();

router.post("/", async (req, res) => {
  const body = req.body;
  const parsedData = ZapCreateSchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  const zap = await db.zap.create({
    data: {
      userId: 1,
      trigger: {
        create: {
          availTriggerId: +parsedData.data.availableTriggerId,
        },
      },
      actions: {
        create: parsedData.data.actions.map((x, index) => ({
          type: {
            connect: { id: +x.availableActionId },
          },
          sortingOrder: index,
          metadata: x.actionMetadata,
        })),
      },
    },
  });
  res.json({ zapId: zap.id });
});

export default router;
