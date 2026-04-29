import { Kafka } from "kafkajs";

// Kafka singleton
let kafkaInstance: Kafka | null = null;

export function getKafka() {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: "zaps-queue",
      brokers: ["localhost:9092"],
    });
    async function checkKafkaConnection(
      kafkaInstance: Kafka,
    ): Promise<boolean> {
      const admin = kafkaInstance.admin();
      try {
        await admin.connect();
        await admin.listTopics(); // will throw if broker is unreachable
        console.log("✅ Kafka connected successfully");
        return true;
      } catch (error) {
        console.error("❌ Kafka connection failed:", error);
        return false;
      } finally {
        await admin.disconnect();
      }
    }
    if (kafkaInstance) {
      console.log("Kafka initialized. Checking the connection...");
      checkKafkaConnection(kafkaInstance);
    }
  }

  return kafkaInstance;
}

export default getKafka;
