// Known contacts - extend this array as needed
export interface Contact {
  name: string;
  email: string;
  aliases?: string[]; // alternative names (e.g., "Chris", "Christopher")
}

export const CONTACTS: Contact[] = [
  { name: "Chris", email: "chris@gmail.com", aliases: ["christopher"] },
  {
    name: "Arpit",
    email: "arpitmishra6000@gmail.com",
    aliases: ["arpit mishra"],
  },
  { name: "Priya", email: "priya@gmail.com" },
  { name: "Rahul", email: "rahul@gmail.com" },
  { name: "Sarah", email: "sarah@gmail.com" },
  { name: "John", email: "john.doe@gmail.com", aliases: ["johnny"] },
];

export function findContact(name: string): Contact | undefined {
  const lower = name.toLowerCase().trim();
  return CONTACTS.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.email.toLowerCase().includes(lower) ||
      (c.aliases || []).some((a) => a.toLowerCase() === lower),
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
