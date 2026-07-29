import { NextResponse } from "next/server";
import { getRides } from "../../lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const rides = await getRides();
  return NextResponse.json(rides);
}
