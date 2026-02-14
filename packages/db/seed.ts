import db from "./client";

async function main() {
  const availableActionsOrTriggers = [
    {
      name: "Google Drive",
      imageUrl: "https://cdn.simpleicons.org/googledrive",
    },
    {
      name: "Gmail",
      imageUrl: "https://cdn.simpleicons.org/gmail",
    },
    {
      name: "Slack",
      imageUrl: "https://cdn.simpleicons.org/slack",
    },
    {
      name: "Notion",
      imageUrl: "https://cdn.simpleicons.org/notion",
    },
    {
      name: "Airtable",
      imageUrl: "https://cdn.simpleicons.org/airtable",
    },
    {
      name: "Trello",
      imageUrl: "https://cdn.simpleicons.org/trello",
    },
    {
      name: "Asana",
      imageUrl: "https://cdn.simpleicons.org/asana",
    },
    {
      name: "Dropbox",
      imageUrl: "https://cdn.simpleicons.org/dropbox",
    },
  ];

  for (const item of availableActionsOrTriggers) {
    await db.availableAction.create({
      data: item,
    });
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
