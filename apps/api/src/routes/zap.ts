import express from "express";
import { ZapCreateSchema } from "../types/main";
import db from "@repo/db/client";
import "dotenv/config";

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
      userId: parsedData.data.userId ?? 1,
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
  const { userId } = req.query;
  const page = +pageNo;
  const limit = 10;
  try {
    const zaps = await db.zap.findMany({
      where: userId ? { userId: +userId } : undefined,
      take: limit,
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
      name: zap.name,
      createdAt: zap.createdAt,
      lastRun: zap.finishedAt,
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

  }
  catch (err: any) {
    console.log("DB Error ", err?.message);
    res.json({ error: true, msg: err?.message });

  }
});

export default router;
