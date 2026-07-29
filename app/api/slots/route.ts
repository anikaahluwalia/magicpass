import { NextResponse } from "next/server";
import { getSlotsForRide } from "../../lib/data";
import { validateId } from "../../lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rideId = validateId(searchParams.get("rideId"), "rideId");

  if (!rideId.ok) {
    return NextResponse.json({ error: rideId.error }, { status: 400 });
  }

  const slots = await getSlotsForRide(rideId.value);
  return NextResponse.json(slots);
}
