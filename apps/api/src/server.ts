import express from "express";
import actionRouter from "./routes/action";
import triggerRouter from "./routes/trigger";
import zapRouter from "./routes/zap";
import hookRouter from "./routes/hooks";
import cors from "cors";
import "dotenv/config";
import { processMessage } from "./aiService";

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (_, res) => res.send("working  "));
app.use("/api/v1/actions", actionRouter);
app.use("/api/v1/triggers", triggerRouter);
app.use("/api/v1/zap", zapRouter);
app.use("/api/v1/hook", hookRouter);
app.post("/api/v1/chat", async (req, res) => {
  console.log(req.body);
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "message field is required" });
    return;
  }

  try {
    console.log(`Processing message: "${message.substring(0, 100)}..."`);
    const result = await processMessage(message.trim());

    res.json({
      success: true,
      type: result.type,
      message: result.message,
      ...(result.mailData ? { mailData: result.mailData } : {}),
    });
  } catch (error) {
    console.error("Error processing message:", error);
    const errMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log("Server Connected " + PORT));
