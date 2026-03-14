import express, { Response } from "express";
const router = express.Router();

let clients: { res: Response; url: string }[] = [];
router.post("/:url", async (req, res) => {
  const { url } = req.params as { url: string };

  const data = req.body;
  const client = clients.find((c) => c.url === url);
  if (client) {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  } else {
    res.status(400).json({ success: false, message: "Invalid URL" });
  }
  res.send("data reached");
});

router.get("/:url", (req, res) => {
  const { url } = req.params as { url: string };
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push({ res, url });
  req.on("close", () => {
    res.end();
    console.log("closing....");
    clients = clients.filter((client) => client.url !== url);
  });
});

export default router;
