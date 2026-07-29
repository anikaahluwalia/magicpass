import { NextResponse } from "next/server";
import { cancelBooking, createBooking, listRecentBookings } from "../../lib/data";
import {
  validateGuestName,
  validateId,
  validatePartySize,
} from "../../lib/validation";

// Never serve a cached response for this endpoint.
export const dynamic = "force-dynamic";

export async function GET() {
  const bookings = await listRecentBookings();
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  let body: { slotId?: unknown; guestName?: unknown; partySize?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slotId = validateId(body.slotId, "slotId");
  if (!slotId.ok) {
    return NextResponse.json({ error: slotId.error }, { status: 400 });
  }

  const guestName = validateGuestName(body.guestName);
  if (!guestName.ok) {
    return NextResponse.json({ error: guestName.error }, { status: 400 });
  }

  // partySize is optional; default to 1 (a single guest).
  const partySize = validatePartySize(body.partySize ?? 1);
  if (!partySize.ok) {
    return NextResponse.json({ error: partySize.error }, { status: 400 });
  }

  const result = await createBooking(
    slotId.value,
    guestName.value,
    partySize.value
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ bookingId: result.bookingId });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookingId = validateId(searchParams.get("id"), "id");

  if (!bookingId.ok) {
    return NextResponse.json({ error: bookingId.error }, { status: 400 });
  }

  const result = await cancelBooking(bookingId.value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
