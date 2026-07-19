import db from "./client";

async function main() {
  const availableTriggers = [
    {
      name: "Webhook",
      imageUrl: "https://cdn.simpleicons.org/looker",
      disabled: false,
      options: ["catch hook"],
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
      options: ["send mail"],
    },
    {
      name: "Github",
      imageUrl: "https://cdn.simpleicons.org/github",
      disabled: false,
      options: ["create issue"],
    },
    {
      name: "Webhook",
      imageUrl: "https://cdn.simpleicons.org/looker",
      options: [],
    },
    {
      name: "Slack",
      imageUrl: "https://cdn.simpleicons.org/slack",
      options: [],
    },
  ];

  for (const { options, ...item } of availableActions) {
    const existing = await db.availableAction.findFirst({
      where: { name: item.name },
    });
    const action = existing
      ? await db.availableAction.update({
          where: { id: existing.id },
          data: item,
        })
      : await db.availableAction.create({ data: item });

    for (const optionName of options) {
      const existingOption = await db.actionOption.findFirst({
        where: { actionid: action.id, name: optionName },
      });
      if (!existingOption) {
        await db.actionOption.create({
          data: { actionid: action.id, name: optionName },
        });
      }
    }
  }

  for (const { options = [], ...item } of availableTriggers) {
    const existing = await db.availableTrigger.findFirst({
      where: { name: item.name },
    });
    const trigger = existing
      ? await db.availableTrigger.update({
          where: { id: existing.id },
          data: item,
        })
      : await db.availableTrigger.create({ data: item });

    for (const optionName of options) {
      const existingOption = await db.triggerOption.findFirst({
        where: { triggerId: trigger.id, name: optionName },
      });
      if (!existingOption) {
        await db.triggerOption.create({
          data: { triggerId: trigger.id, name: optionName },
        });
      }
    }
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
