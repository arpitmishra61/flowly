const { execSync } = require("child_process");

const wait = () => {
  try {
    execSync(
      "docker exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092",
      { stdio: "ignore" },
    );
    console.log("✅ Kafka is ready!");
  } catch {
    console.log("⏳ Waiting for Kafka...");
    setTimeout(wait, 3000);
  }
};

wait();
