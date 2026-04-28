import db from "@repo/db/client";
import getKafka from "@repo/kafka/client";

async function main() {
  const kafka = getKafka();
  const producer = kafka.producer();
  await producer.connect();
  const TOPIC_NAME = "zap-events";

  while (1) {
    const pendingRows = await db.zapRun.findMany({
      where: {},
      take: 10,
    });
    console.log(pendingRows);

    await producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r) => {
        return {
          value: JSON.stringify({ zapRunId: r.zapId, stage: 0 }),
        };
      }),
    });

    await db.zapRun.updateMany({
      where: {
        id: {
          in: pendingRows.map((x) => x.id),
        },
        status: "PENDING",
      },
      data: {
        status: "RUNNING",
      },
    });

    await new Promise((r) => setTimeout(r, 3000));
  }
}
main();
