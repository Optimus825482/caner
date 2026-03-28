import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/get-public-settings";

export async function GET() {
  const settings = await getPublicSettings();
  return NextResponse.json(settings);
}
