// Centralized data-access layer. All database queries live here so API
// routes stay thin and the booking logic has a single source of truth.

import { prisma } from "./prisma";
import type { BookingRow, Ride, Slot } from "./types";

export async function getRides(): Promise<Ride[]> {
  return prisma.ride.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getSlotsForRide(rideId: string): Promise<Slot[]> {
  const slots = await prisma.slot.findMany({
    where: { rideId },
    orderBy: { startTime: "asc" },
  });

  return slots.map((s) => ({
    id: s.id,
    rideId: s.rideId,
    startTime: s.startTime.toISOString(),
    capacity: s.capacity,
    booked: s.booked,
  }));
}

export async function listRecentBookings(limit = 50): Promise<BookingRow[]> {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { slot: { include: { ride: true } } },
    take: limit,
  });

  return bookings.map((b) => ({
    id: b.id,
    guestName: b.guestName,
    partySize: b.partySize,
    rideName: b.slot.ride.name,
    land: b.slot.ride.land,
    startTime: b.slot.startTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }));
}

export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; status: number; error: string };

// Creates a booking for `partySize` seats without overbooking. The capacity
// check and the `booked` increment happen in a single conditional updateMany,
// so concurrent requests can't push a slot past its capacity.
export async function createBooking(
  slotId: string,
  guestName: string,
  partySize: number
): Promise<BookingResult> {
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) return { ok: false, status: 404, error: "Slot not found" };

  // Fast, friendly rejection before we touch the transaction.
  if (slot.capacity - slot.booked < partySize) {
    const remaining = Math.max(0, slot.capacity - slot.booked);
    return {
      ok: false,
      status: 409,
      error:
        remaining === 0
          ? "Slot is full"
          : `Only ${remaining} seat(s) left in this slot`,
    };
  }

  try {
    const bookingId = await prisma.$transaction(async (tx) => {
      // Only succeeds if there is still room for the whole party.
      const claimed = await tx.slot.updateMany({
        where: { id: slotId, booked: { lte: slot.capacity - partySize } },
        data: { booked: { increment: partySize } },
      });

      // No row matched -> the slot filled up between read and write.
      if (claimed.count === 0) return null;

      const booking = await tx.booking.create({
        data: { slotId, guestName, partySize },
      });
      return booking.id;
    });

    if (!bookingId) return { ok: false, status: 409, error: "Not enough seats left" };
    return { ok: true, bookingId };
  } catch {
    return { ok: false, status: 500, error: "Booking failed" };
  }
}

export type CancelResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function cancelBooking(bookingId: string): Promise<CancelResult> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, status: 404, error: "Booking not found" };

  try {
    await prisma.$transaction([
      prisma.slot.update({
        where: { id: booking.slotId },
        data: { booked: { decrement: booking.partySize } },
      }),
      prisma.booking.delete({ where: { id: bookingId } }),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, status: 500, error: "Cancel failed" };
  }
}
