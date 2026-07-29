"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { MAX_PARTY_SIZE, type BookingRow, type Ride, type Slot } from "./lib/types";

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Confirmation = {
  bookingId: string;
  rideName: string;
  time: string;
  partySize: number;
};

export default function Home() {
  const [guestName, setGuestName] = useState("");
  const [mode, setMode] = useState<"single" | "family">("single");
  const [familySize, setFamilySize] = useState(2);

  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRideId, setSelectedRideId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const [error, setError] = useState("");
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const partySize = mode === "single" ? 1 : familySize;

  const selectedRide = useMemo(
    () => rides.find((r) => r.id === selectedRideId),
    [rides, selectedRideId]
  );

  const loadRides = useCallback(async () => {
    const res = await fetch("/api/rides", { cache: "no-store" });
    const data = (await res.json()) as Ride[];
    setRides(data);
    setSelectedRideId((current) => current || data[0]?.id || "");
  }, []);

  const loadSlots = useCallback(async (rideId: string) => {
    const res = await fetch(`/api/slots?rideId=${encodeURIComponent(rideId)}`, {
      cache: "no-store",
    });
    setSlots((await res.json()) as Slot[]);
  }, []);

  const loadBookings = useCallback(async () => {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    setBookings((await res.json()) as BookingRow[]);
  }, []);

  useEffect(() => {
    void loadRides();
    void loadBookings();
  }, [loadRides, loadBookings]);

  useEffect(() => {
    if (selectedRideId) void loadSlots(selectedRideId);
  }, [selectedRideId, loadSlots]);

  async function book(slot: Slot) {
    setError("");
    const name = guestName.trim();
    if (name.length < 2) {
      setError("Enter your name (2+ characters) before booking.");
      return;
    }

    setPendingSlotId(slot.id);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, guestName: name, partySize }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Booking failed.");
        return;
      }

      setConfirmation({
        bookingId: data.bookingId,
        rideName: selectedRide?.name ?? "your ride",
        time: slot.startTime,
        partySize,
      });

      if (selectedRideId) await loadSlots(selectedRideId);
      await loadBookings();
    } finally {
      setPendingSlotId(null);
    }
  }

  async function cancel(bookingId: string) {
    await fetch(`/api/bookings?id=${encodeURIComponent(bookingId)}`, {
      method: "DELETE",
    });
    await loadBookings();
    if (selectedRideId) await loadSlots(selectedRideId);
  }

  function bookAnother() {
    setConfirmation(null);
    // Keep the name and ride selected so booking again is quick.
  }

  function finishBooking() {
    setConfirmation(null);
    setGuestName("");
    setMode("single");
    setFamilySize(2);
  }

  return (
    <>
      <header className="header">
        <h1>MagicPass ✨</h1>
        <p>Reserve your ride times</p>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          <section className="card">
            <h2 className={styles.cardTitle}>Book a ride</h2>

            <label className={styles.label} htmlFor="guestName">
              Guest name
            </label>
            <input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className={styles.fullWidth}
            />

            <label className={styles.label}>Who&apos;s riding?</label>
            <div className={styles.segmented} role="group" aria-label="Booking type">
              <button
                type="button"
                className={mode === "single" ? styles.segActive : styles.seg}
                onClick={() => setMode("single")}
              >
                Just me
              </button>
              <button
                type="button"
                className={mode === "family" ? styles.segActive : styles.seg}
                onClick={() => setMode("family")}
              >
                Family / group
              </button>
            </div>

            {mode === "family" && (
              <div className={styles.stepperRow}>
                <span className={styles.stepperLabel}>Party size</span>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    disabled={familySize <= 2}
                    onClick={() => setFamilySize((n) => Math.max(2, n - 1))}
                    aria-label="Decrease party size"
                  >
                    −
                  </button>
                  <span className={styles.stepValue}>{familySize}</span>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    disabled={familySize >= MAX_PARTY_SIZE}
                    onClick={() =>
                      setFamilySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))
                    }
                    aria-label="Increase party size"
                  >
                    +
                  </button>
                </div>
                <span className={styles.hint}>up to {MAX_PARTY_SIZE}</span>
              </div>
            )}

            <label className={styles.label} htmlFor="ride">
              Ride
            </label>
            <select
              id="ride"
              value={selectedRideId}
              onChange={(e) => setSelectedRideId(e.target.value)}
              className={styles.fullWidth}
            >
              {rides.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.land}
                </option>
              ))}
            </select>

            {selectedRide && (
              <p className={styles.rideDesc}>{selectedRide.description}</p>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.slotsHeader}>
              <h3 className={styles.sectionHeading}>Available times</h3>
              <span className={styles.seatsNeeded}>
                Booking {partySize} {partySize === 1 ? "seat" : "seats"}
              </span>
            </div>

            <div className={styles.slotList}>
              {slots.length === 0 && (
                <div className={styles.empty}>No times available.</div>
              )}
              {slots.map((s) => {
                const remaining = Math.max(0, s.capacity - s.booked);
                const notEnough = remaining < partySize;
                const pending = pendingSlotId === s.id;
                return (
                  <div key={s.id} className={styles.slot}>
                    <div>
                      <div className={styles.slotTime}>{fmtTime(s.startTime)}</div>
                      <div className={styles.slotMeta}>
                        {remaining} of {s.capacity} seats left
                      </div>
                    </div>
                    <button
                      className={styles.bookBtn}
                      disabled={notEnough || pending}
                      onClick={() => book(s)}
                    >
                      {pending
                        ? "Booking…"
                        : remaining === 0
                        ? "Full"
                        : notEnough
                        ? "Not enough"
                        : "Book"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className={styles.slotsHeader}>
              <h2 className={styles.cardTitle}>Recent bookings</h2>
              <button className={styles.ghostBtn} onClick={loadBookings}>
                Refresh
              </button>
            </div>

            <div className={styles.bookingList}>
              {bookings.length === 0 && (
                <div className={styles.empty}>No bookings yet.</div>
              )}
              {bookings.map((b) => (
                <div key={b.id} className={styles.booking}>
                  <div>
                    <div className={styles.bookingTitle}>
                      {b.guestName}
                      {b.partySize > 1 && (
                        <span className={styles.partyBadge}>
                          party of {b.partySize}
                        </span>
                      )}
                    </div>
                    <div className={styles.bookingMeta}>
                      {b.rideName} • {fmtDateTime(b.startTime)}
                    </div>
                  </div>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => cancel(b.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {confirmation && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={finishBooking}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🎉</div>
            <h2 className={styles.modalTitle}>You&apos;re booked!</h2>
            <p className={styles.modalText}>
              {confirmation.partySize > 1
                ? `${confirmation.partySize} seats`
                : "1 seat"}{" "}
              on <strong>{confirmation.rideName}</strong> at{" "}
              <strong>{fmtTime(confirmation.time)}</strong>.
            </p>
            <p className={styles.modalConf}>
              Confirmation {confirmation.bookingId}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.bookBtn} onClick={bookAnother}>
                Book another
              </button>
              <button className={styles.ghostBtn} onClick={finishBooking}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
