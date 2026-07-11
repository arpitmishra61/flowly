import db from "@repo/db/client";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  const { email } = req.query as { email?: string };

  if (!email) {
    return res.status(400).json({ success: false, message: "email is required" });
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { contacts: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({
    success: true,
    contacts: user.contacts.map((c) => ({ id: c.id, name: c.name, email: c.email })),
  });
});

router.post("/", async (req, res) => {
  const { email, name, contactEmail } = req.body as {
    email?: string;
    name?: string;
    contactEmail?: string;
  };

  if (!email || !name || !contactEmail) {
    return res.status(400).json({
      success: false,
      message: "email, name and contactEmail are required",
    });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  try {
    const contact = await db.contact.create({
      data: { name, email: contactEmail, userId: user.id },
    });
    res.json({
      success: true,
      contact: { id: contact.id, name: contact.name, email: contact.email },
    });
  } catch (err: any) {
    console.log("DB Error ", err?.message);
    res.status(400).json({ success: false, message: "Failed to create contact (maybe duplicate?)" });
  }
});

export default router;
