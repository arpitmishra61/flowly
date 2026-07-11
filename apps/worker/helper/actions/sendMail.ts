import nodemailer from "nodemailer";

export default async function sendMail({
  name,
  from,
  pass,
  to,
  subject,
  body,
}: Record<"name" | "from" | "pass" | "to" | "subject" | "body", string>) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: from,
      pass,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: `"${name}" <${from}>`,
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
