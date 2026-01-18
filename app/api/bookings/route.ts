import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      slot: {
        include: {
          ride: true,
        },
      },
    },
    take: 50,
  });

  return NextResponse.json(
    bookings.map((b: any) => ({
      id: b.id,
      guestName: b.guestName,
      rideName: b.slot.ride.name,
      land: b.slot.ride.land,
      startTime: b.slot.startTime,
      createdAt: b.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as { slotId?: string; guestName?: string };

  if (!body.slotId || !body.guestName) {
    return NextResponse.json(
      { error: "slotId and guestName are required" },
      { status: 400 }
    );
  }

  const guestName = body.guestName.trim();
  if (guestName.length < 2) {
    return NextResponse.json({ error: "guestName too short" }, { status: 400 });
  }

  const slot = await prisma.slot.findUnique({ where: { id: body.slotId } });
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  if (slot.booked >= slot.capacity) {
    return NextResponse.json({ error: "Slot is full" }, { status: 409 });
  }

  try {
    const [, booking] = await prisma.$transaction([
      prisma.slot.update({
        where: { id: slot.id },
        data: { booked: { increment: 1 } },
      }),
      prisma.booking.create({
        data: { slotId: slot.id, guestName },
      }),
    ]);

    return NextResponse.json({ bookingId: booking.id });
  } catch {
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");
  
    if (!bookingId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
  
    // Find booking first
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
  
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
  
    try {
      // Decrement slot + delete booking atomically
      await prisma.$transaction([
        prisma.slot.update({
          where: { id: booking.slotId },
          data: { booked: { decrement: 1 } },
        }),
        prisma.booking.delete({
          where: { id: bookingId },
        }),
      ]);
  
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
    }
  }
  
