import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  try {
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "MISSING");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 40));

    const users = await prisma.user.findMany();
    console.log("DB OK. Users count:", users.length);
  } catch (e) {
    console.log("DB ERROR:", e.message.slice(0, 500));
    console.log("ERROR CODE:", e.code);
  } finally {
    await prisma.$disconnect();
  }
})();
