# MagicPass ✨

A small ride-reservation app for a theme park. Guests pick a ride, see the
available time slots, and book a spot. Slots have a fixed capacity and can't be
overbooked. Built with Next.js (App Router), Prisma, and SQLite.

## Tech stack

- **Next.js 16** (App Router, React 19) — UI and API routes
- **Prisma 6** — ORM, with a local SQLite database
- **TypeScript**

## Project structure

```
app/
  api/
    rides/route.ts        GET  /api/rides      — list rides
    slots/route.ts        GET  /api/slots      — slots for a ride (?rideId=)
    bookings/route.ts     GET/POST/DELETE /api/bookings — list, book, cancel
  lib/
    prisma.ts             Prisma client singleton
    types.ts              Shared types used by client + API
    data.ts               Data-access layer (all DB queries live here)
    validation.ts         Input validation helpers
  page.tsx                Booking UI (client component)
  page.module.css         Page layout styles
  globals.css             App-wide styles
prisma/
  schema.prisma           Ride / Slot / Booking models
  seed.ts                 Seeds sample rides + slots
  dev.db                  Local SQLite database
```

API routes are intentionally thin — they validate input and delegate to
`app/lib/data.ts`, which is the single source of truth for database logic.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Set up the database (generate the client, apply the schema, seed data):

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How booking works

Each `Slot` has a `capacity` and a `booked` count. Booking is done in a single
conditional update inside a transaction:

```ts
UPDATE Slot SET booked = booked + 1 WHERE id = ? AND booked < capacity
```

If no row matches (the slot just filled up), the booking is rejected with
`409 Slot is full`. This makes booking safe under concurrent requests — two
people racing for the last seat can't both succeed. Cancelling a booking
decrements `booked` and deletes the booking in the same transaction.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint
- `npm run prisma:seed` — reseed the database
