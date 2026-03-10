import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  const availTriggers = await db.availableTrigger.findMany();
  res.json(availTriggers);
});

router.get("/options/:id", async (req, res) => {
  let { id } = req.params;
  const triggerId = Number(id);
  console.log("Fefe");
  if (id && !isNaN(triggerId)) {
    const availTriggers = await db.triggerOption.findMany({
      where: {
        triggerId,
      },
      select: {
        name: true,
      },
    });
    res.json(availTriggers);
  } else {
    res.status(500).json({ success: false, error: "Invalid Id" });
  }
});

export default router;
