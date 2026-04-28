import { Kafka } from "kafkajs";

const TOPIC_NAME = "zap-events";

// Kafka singleton
let kafkaInstance: Kafka | null = null;

export function getKafka() {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: "zaps-queue",
      brokers: ["localhost:9092"],
    });
  }

  return kafkaInstance;
}

export default getKafka;
