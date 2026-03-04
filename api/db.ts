
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
const adapter = new PrismaBetterSqlite3({
    url: "file:./dev.db"
})
const prisma = new PrismaClient({adapter})
export const connectDb = async () => {
    try {
        await prisma.$disconnect()
    } catch (error) {
        console.error('Error connecting to prisma:',error);
        await prisma.$disconnect();
    }
}