-- AlterTable: add party size to bookings (defaults to 1 for existing rows)
ALTER TABLE "Booking" ADD COLUMN "partySize" INTEGER NOT NULL DEFAULT 1;
