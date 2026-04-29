import db from "@repo/db/client";
import getKafka from "@repo/kafka/client";
import parse from "./helper/parser";
import sendMail from "./helper/actions/sendMail";

async function main() {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId: "main-worker-2" });
  await consumer.connect();
  const producer = kafka.producer();
  await producer.connect();
  const TOPIC_NAME = "zap-events";

  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });
      if (!message.value?.toString()) {
        return;
      }

      const parsedValue = JSON.parse(message.value?.toString());
      const zapRunId = parsedValue.id;
      const stage = parsedValue.stage;

      const zapRunDetails = await db.zapRun.findFirst({
        where: {
          id: zapRunId,
        },
        include: {
          zap: {
            include: {
              actions: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });
      const currentAction = zapRunDetails?.zap.actions.find(
        (x) => x.sortingOrder === stage,
      );

      if (!currentAction) {
        console.log("Current action not found?");
        return;
      } else {
        console.log("current action ", currentAction);
      }

      const zapRunMetadata = zapRunDetails?.metadata;
      const actionName = currentAction.type.name;
      const { body, to, subject } = currentAction.metadata as any;

      if (actionName === "Gmail") {
        console.log("Sending mail");
        const bodyData = parse(body, zapRunMetadata);
        const subjectData = parse(subject, zapRunMetadata);
        const reciever = parse(to, zapRunMetadata);

        const success = await sendMail({
          from: "arpitmishra61@gmail.com",
          to: reciever,
          subject: subjectData,
          body: bodyData,
        });
        if (success) {
          console.log("Email Sent");
        } else {
          console.log("Email Not Sent");
        }
      }

      await new Promise((r) => setTimeout(r, 500));

      const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // 1
      console.log(lastStage);
      console.log(stage);
      if (lastStage !== stage) {
        console.log("pushing back to the queue");
        await producer.send({
          topic: TOPIC_NAME,
          messages: [
            {
              value: JSON.stringify({
                stage: stage + 1,
                zapRunId,
              }),
            },
          ],
        });
      } else {
        const result = await db.zapRun.updateMany({
          where: {
            id: zapRunDetails?.id,
            status: "RUNNING",
          },
          data: {
            status: "COMPLETE",
          },
        });
        if (result.count) {
          console.log("Zap Status:Completed");
        } else {
          console.log("Zap Status:Error");
        }
      }

      console.log(
        "processing done for action no ",
        parseInt(message.offset) + 1,
      );

      await consumer.commitOffsets([
        {
          topic: TOPIC_NAME,
          partition: partition,
          offset: (parseInt(message.offset) + 1).toString(), // 5
        },
      ]);
    },
  });
}

main();
