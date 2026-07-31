import { NextResponse } from "next/server";
import { mintApiToken } from "@/lib/apiToken";

export async function GET() {
  const token = await mintApiToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
