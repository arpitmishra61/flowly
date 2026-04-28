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
router.get("/:pageNo", async (req, res) => {
  let { pageNo } = req.params;
  const page = +pageNo;
  const limit = 10;

  const zaps = await db.zap.findMany({
    take: 10,
    include: {
      trigger: {
        include: {
          type: true, // AvailableTrigger
        },
      },
      actions: {
        include: {
          type: true, // AvailableAction
        },
        orderBy: {
          sortingOrder: "asc",
        },
      },
    },
  });

  const formatted = zaps.map((zap) => ({
    id: zap.id,
    trigger: zap.trigger
      ? {
          name: zap.trigger.type.name,
          imageUrl: zap.trigger.type.imageUrl,
        }
      : null,
    actions: zap.actions.map((action) => ({
      name: action.type.name,
      imageUrl: action.type.imageUrl,
    })),
  }));
  res.json(formatted);
});

export default router;
