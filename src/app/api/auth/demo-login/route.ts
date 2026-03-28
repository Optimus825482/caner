import { NextRequest, NextResponse } from "next/server";
import { enforceSameOrigin } from "@/lib/request-guards";

const isDemoModeEnabled =
  process.env.DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const demoUsername = process.env.DEMO_USERNAME ?? "admin";
const demoPassword = process.env.DEMO_PASSWORD ?? "";

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  if (!isDemoModeEnabled) {
    return NextResponse.json(
      { error: "Demo mode is disabled" },
      { status: 404 },
    );
  }

  if (!demoPassword) {
    return NextResponse.json(
      { error: "Server demo credentials are not configured" },
      { status: 500 },
    );
  }

  // Return demo credentials to client — client will call signIn() itself.
  // This is safe because demo mode is explicitly opt-in and credentials
  // are already public by design (demo accounts).
  return NextResponse.json({
    success: true,
    username: demoUsername,
    password: demoPassword,
  });
}
