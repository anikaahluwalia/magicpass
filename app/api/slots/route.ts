import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rideId = searchParams.get("rideId");

  if (!rideId) {
    return NextResponse.json({ error: "rideId is required" }, { status: 400 });
  }

  const slots = await prisma.slot.findMany({
    where: { rideId },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}
