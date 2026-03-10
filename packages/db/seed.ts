import { AvailableAction } from "./generated/prisma/client";
import db from "./client";

async function main() {
  const availableTriggers = [
    {
      name: "Webhook",
      imageUrl: "https://cdn.simpleicons.org/looker",
      disabled: false,
    },
    {
      name: "Gmail",
      imageUrl: "https://cdn.simpleicons.org/gmail",
    },
    {
      name: "Slack",
      imageUrl: "https://cdn.simpleicons.org/slack",
    },
  ];

  const availableActions = [
    {
      name: "Gmail",
      imageUrl: "https://cdn.simpleicons.org/gmail",
      disabled: false,
    },
    {
      name: "Webhook",
      imageUrl: "https://cdn.simpleicons.org/looker",
    },

    {
      name: "Slack",
      imageUrl: "https://cdn.simpleicons.org/slack",
    },
  ];
  await db.availableAction.deleteMany();
  await db.availableTrigger.deleteMany();
  for (const item of availableActions) {
    await db.availableAction.create({
      data: item,
    });
  }
  for (const item of availableTriggers) {
    await db.availableTrigger.create({
      data: item,
    });
  }

  console.log("✅ Available actions and triggers seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
