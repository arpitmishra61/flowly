import express from "express";
import db from "@repo/db/client";
import "dotenv/config";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3002;

app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  // store in db a new trigger
  console.log("sfsf", zapId, body, userId);
  const run = await db.zapRun.create({
    data: {
      zapId: zapId,
      metadata: body,
    },
  });
  res.json({
    message: "Webhook received " + run.id,
    userId,
  });
});

app.listen(PORT, () => console.log("Hook is connected at PORT ", PORT));
