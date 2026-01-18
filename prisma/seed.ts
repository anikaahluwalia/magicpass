import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.ride.deleteMany();

  await prisma.ride.createMany({
    data: [
      {
        name: "Skyline Soarer",
        land: "Tomorrow District",
        description: "A high-speed glide above a futuristic city.",
      },
      {
        name: "Jungle Drift",
        land: "Adventure Bay",
        description: "A river escape through mysterious ruins.",
      },
      {
        name: "Star Harbor Run",
        land: "Galaxy Port",
        description: "A mission-based starship run with dynamic routes.",
      },
    ],
  });

  const rides = await prisma.ride.findMany();

  const today = new Date();
  today.setHours(10, 0, 0, 0);

  for (const ride of rides) {
    for (let i = 0; i < 10; i++) {
      const start = new Date(today.getTime() + i * 30 * 60 * 1000);
      await prisma.slot.create({
        data: {
          rideId: ride.id,
          startTime: start,
          capacity: 12,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
