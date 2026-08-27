import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

// Verifies the admin password so the manage screen can gate access.
// Actual writes are still validated on every request in the items routes.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ok =
    typeof body.password === "string" && body.password === getEnv("ADMIN_PASSWORD");
  return NextResponse.json({ ok });
}
