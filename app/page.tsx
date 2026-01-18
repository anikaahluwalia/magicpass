"use client";

import { useEffect, useMemo, useState } from "react";

type Ride = { id: string; name: string; land: string; description: string };
type Slot = { id: string; rideId: string; startTime: string; capacity: number; booked: number };
type BookingRow = { id: string; guestName: string; rideName: string; land: string; startTime: string; createdAt: string };

function fmt(dt: string) {
  return new Date(dt).toLocaleString();
}

export default function Home() {
  const [guestName, setGuestName] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRideId, setSelectedRideId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [status, setStatus] = useState("");

  const selectedRide = useMemo(
    () => rides.find((r) => r.id === selectedRideId),
    [rides, selectedRideId]
  );

  async function loadRides() {
    const res = await fetch("/api/rides");
    const data = (await res.json()) as Ride[];
    setRides(data);
    if (!selectedRideId && data.length) setSelectedRideId(data[0].id);
  }

  async function loadSlots(rideId: string) {
    const res = await fetch(`/api/slots?rideId=${encodeURIComponent(rideId)}`);
    setSlots((await res.json()) as Slot[]);
  }

  async function loadBookings() {
    const res = await fetch("/api/bookings");
    setBookings((await res.json()) as BookingRow[]);
  }

  useEffect(() => {
    void loadRides();
    void loadBookings();
  }, []);

  useEffect(() => {
    if (selectedRideId) void loadSlots(selectedRideId);
  }, [selectedRideId]);

  async function book(slotId: string) {
    setStatus("");
    const name = guestName.trim();
    if (name.length < 2) return setStatus("Enter your name (2+ chars) before booking.");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, guestName: name }),
    });

    const data = await res.json();
    if (!res.ok) return setStatus(data?.error ?? "Booking failed.");

    setStatus(`✨ Booked! Confirmation: ${data.bookingId}`);
    if (selectedRideId) await loadSlots(selectedRideId);
    await loadBookings();
  }

  return (
    <>
      <div className="header">
        <h1>MagicPass ✨</h1>
        <p>Booking for Ride Times</p>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <section className="card">
            <h2>Guest Name</h2>

            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              style={{ width: "100%", marginBottom: 12 }}
            />

            <select
              value={selectedRideId}
              onChange={(e) => setSelectedRideId(e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            >
              {rides.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.land}
                </option>
              ))}
            </select>

            {selectedRide && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>{selectedRide.name}</div>
                <div style={{ color: "#64748b" }}>{selectedRide.description}</div>
              </div>
            )}

            <button onClick={() => selectedRideId && loadSlots(selectedRideId)}>Refresh slots</button>

            {status && (
              <div style={{ marginTop: 12 }} className="badge">
                {status}
              </div>
            )}

            <h3 style={{ marginTop: 20 }}>Available slots</h3>

            <div style={{ display: "grid", gap: 12 }}>
              {slots.map((s) => {
                const remaining = s.capacity - s.booked;
                const full = remaining <= 0;
                return (
                  <div key={s.id} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{fmt(s.startTime)}</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      Capacity {s.capacity} • Booked {s.booked} • Remaining {Math.max(0, remaining)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button disabled={full} onClick={() => book(s.id)}>
                        {full ? "Full" : "Book"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2>Recent bookings</h2>
            <button onClick={loadBookings} style={{ marginBottom: 12 }}>
              Refresh bookings
            </button>

            <div style={{ display: "grid", gap: 12 }}>
            {bookings.map((b) => (
  <div key={b.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontWeight: 700 }}>
        {b.guestName} → {b.rideName}
      </div>
      <div style={{ color: "#64748b", fontSize: 13 }}>
        {fmt(b.startTime)} • {b.land}
      </div>
    </div>

    <button
      style={{
        background: "#e11d48",
        boxShadow: "none",
      }}
      onClick={async () => {
        await fetch(`/api/bookings?id=${b.id}`, { method: "DELETE" });
        await loadBookings();
        if (selectedRideId) await loadSlots(selectedRideId);
      }}
    >
      Cancel
    </button>
  </div>
))}

            </div>
          </section>
        </div>
      </main>
    </>
  );
}
