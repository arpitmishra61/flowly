import express from "express";
import actionRouter from "./routes/action";
import triggerRouter from "./routes/trigger";
import zapRouter from "./routes/zap";
import hookRouter from "./routes/hooks";
import cors from "cors";

const app = express();
import "dotenv/config";

app.use(cors());
app.use(express.json());

app.use("/api/v1/actions", actionRouter);
app.use("/api/v1/triggers", triggerRouter);
app.use("/api/v1/zap", zapRouter);
app.use("/api/v1/hook", hookRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server Connected " + PORT));
