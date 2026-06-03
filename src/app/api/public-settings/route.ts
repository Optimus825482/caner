import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/get-public-settings";

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to load public settings" },
      { status: 500 },
    );
  }
}
