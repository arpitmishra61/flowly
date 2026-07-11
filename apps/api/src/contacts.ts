import db from "@repo/db/client";

export interface Contact {
  name: string;
  email: string;
}

export async function getContactsForUser(ownerEmail: string): Promise<Contact[]> {
  const user = await db.user.findUnique({
    where: { email: ownerEmail },
    include: { contacts: true },
  });

  return user?.contacts.map((c) => ({ name: c.name, email: c.email })) || [];
}

export function findContact(contacts: Contact[], name: string): Contact | undefined {
  const lower = name.toLowerCase().trim();
  return contacts.find(
    (c) => c.name.toLowerCase() === lower || c.email.toLowerCase().includes(lower),
  );
}

export interface MailOutput {
  to: string;
  body: string;
  subject: string
}

export interface ChatResponse {
  type: "mail" | "general";
  message: string;
  mailData?: MailOutput;
}
