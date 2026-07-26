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
          metadata: parsedData.data.triggerMetadata ?? {},
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

router.get("/detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const zap = await db.zap.findUnique({
      where: { id },
      include: {
        trigger: {
          include: {
            type: true,
          },
        },
        actions: {
          include: {
            type: true,
          },
          orderBy: {
            sortingOrder: "asc",
          },
        },
      },
    });

    if (!zap) {
      return res.status(404).json({ message: "Zap not found" });
    }

    res.json({
      id: zap.id,
      name: zap.name,
      userId: zap.userId,
      trigger: zap.trigger
        ? {
          availableTriggerId: zap.trigger.availTriggerId,
          metadata: zap.trigger.metadata,
          type: {
            id: zap.trigger.type.id,
            name: zap.trigger.type.name,
            imageUrl: zap.trigger.type.imageUrl,
          },
        }
        : null,
      actions: zap.actions.map((action) => ({
        availableActionId: action.availActionId,
        metadata: action.metadata,
        type: {
          id: action.type.id,
          name: action.type.name,
          imageUrl: action.type.imageUrl,
        },
      })),
    });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(500).json({ error: true, msg: err?.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const parsedData = ZapCreateSchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  try {
    const existing = await db.zap.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Zap not found" });
    }

    await db.$transaction([
      db.trigger.update({
        where: { zapId: id },
        data: {
          availTriggerId: +parsedData.data.availableTriggerId,
          metadata: parsedData.data.triggerMetadata ?? {},
        },
      }),
      db.action.deleteMany({ where: { zapId: id } }),
      db.action.createMany({
        data: parsedData.data.actions.map((x, index) => ({
          zapId: id,
          availActionId: +x.availableActionId,
          sortingOrder: index,
          metadata: x.actionMetadata,
        })),
      }),
    ]);

    res.json({ zapId: id });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(500).json({ error: true, msg: err?.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.zap.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Zap not found" });
    }

    await db.$transaction([
      db.zapRunOutbox.deleteMany({ where: { zapRun: { zapId: id } } }),
      db.zapRun.deleteMany({ where: { zapId: id } }),
      db.action.deleteMany({ where: { zapId: id } }),
      db.trigger.deleteMany({ where: { zapId: id } }),
      db.zap.delete({ where: { id } }),
    ]);

    res.json({ success: true });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(500).json({ error: true, msg: err?.message });
  }
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
