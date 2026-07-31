import jwt from "jsonwebtoken";
import { auth } from "@/auth";

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

// Mints a short-lived JWT identifying the signed-in user, to be sent as a
// Bearer token to apps/api. apps/api verifies the signature and trusts the
// userId/email inside the token instead of any client-supplied value.
export async function mintApiToken(): Promise<string | null> {
  if (!INTERNAL_API_SECRET) {
    throw new Error("INTERNAL_API_SECRET is not configured");
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return jwt.sign(
    { sub: session.user.id, email: session.user.email },
    INTERNAL_API_SECRET,
    { expiresIn: "5m" },
  );
}
