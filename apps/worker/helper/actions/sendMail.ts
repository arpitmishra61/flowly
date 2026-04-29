import nodemailer from "nodemailer";

export default async function sendMail({
  from,
  to,
  subject,
  body,
}: Record<"from" | "to" | "subject" | "body", string>) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "arpitmishra61@gmail.com",
      pass: "oqmw azfn prse vbza", // NOT your regular Gmail password
    },
  });
  try {
    const info = await transporter.sendMail({
      from: `"Arpit Mishra" <${from}>`,
      to,
      subject,
      text: body,
    });
    return info;
  } catch (err) {
    console.log("Error sending mail");
    return false;
  }
}
