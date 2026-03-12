import prisma from "../src/prisma/client.js";
import { getDashboardStats } from "../src/features/landlord/landlord.service.js";

async function test() {
  try {
    // Attempt to find a landlord ID from the database
    const landlord = await prisma.user.findFirst({
      where: { role: "LANDLORD" },
    });

    if (!landlord) {
      console.log("No landlord found in the database to test with.");
      return;
    }

    console.log(`Testing with landlord ID: ${landlord.id} (${landlord.name})`);

    const stats = await getDashboardStats(landlord.id);

    console.log("Dashboard Stats:");
    console.log(`Total Properties: ${stats.totalProperties}`);
    console.log(`Total Visits: ${stats.totalVisits}`);
    console.log(`Total Bookings: ${stats.totalBookings}`);
    console.log(`My Properties Count: ${stats.myProperties.length}`);
    console.log(`Recent Visits Count: ${stats.recentVisits.length}`);
    console.log(`Recent Bookings Count: ${stats.recentBookings.length}`);

    // console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
