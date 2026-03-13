import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
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

  try {
    await signIn("credentials", {
      username: demoUsername,
      password: demoPassword,
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Demo login failed" }, { status: 401 });
  }
}
