import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  console.log("Fef");
  const availActions = await db.availableAction.findMany();
  res.json(availActions);
});

router.get("/options/:id", async (req, res) => {
  let { id } = req.params;
  const actionId = Number(id);
  console.log("Fefe");
  if (id && !isNaN(actionId)) {
    const availTriggers = await db.actionOption.findMany({
      where: {
        actionid: actionId,
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
