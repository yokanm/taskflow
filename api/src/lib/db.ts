import { PrismaClient } from "../../generated/prisma/client";


const prisma = new PrismaClient();

export const connectDb = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};