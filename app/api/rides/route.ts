import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const rides = await prisma.ride.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rides);
}
