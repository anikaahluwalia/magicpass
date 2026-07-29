// Small input-validation helpers shared by the API routes.

import { MAX_PARTY_SIZE } from "./types";

export const MIN_GUEST_NAME_LENGTH = 2;
export const MAX_GUEST_NAME_LENGTH = 60;

export function validatePartySize(
  value: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) {
    return { ok: false, error: "partySize must be a whole number" };
  }
  if (n < 1) {
    return { ok: false, error: "partySize must be at least 1" };
  }
  if (n > MAX_PARTY_SIZE) {
    return { ok: false, error: `partySize can't exceed ${MAX_PARTY_SIZE}` };
  }
  return { ok: true, value: n };
}

export function validateGuestName(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "guestName is required" };
  }
  const name = value.trim();
  if (name.length < MIN_GUEST_NAME_LENGTH) {
    return { ok: false, error: "guestName too short" };
  }
  if (name.length > MAX_GUEST_NAME_LENGTH) {
    return { ok: false, error: "guestName too long" };
  }
  return { ok: true, value: name };
}

export function validateId(
  value: unknown,
  field: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, value: value.trim() };
}
