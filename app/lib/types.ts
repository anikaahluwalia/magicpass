// Shared types used by both API routes and client components.

export type Ride = {
  id: string;
  name: string;
  land: string;
  description: string;
};

export type Slot = {
  id: string;
  rideId: string;
  startTime: string;
  capacity: number;
  booked: number;
};

export type BookingRow = {
  id: string;
  guestName: string;
  partySize: number;
  rideName: string;
  land: string;
  startTime: string;
  createdAt: string;
};

export const MAX_PARTY_SIZE = 6;

export type ApiError = { error: string };
