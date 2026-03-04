import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const credits = await prisma.metalCredit.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { client: { select: { name: true } } }
    });
    console.log("=== Last Updated Credits ===");
    credits.forEach((c: any) => console.log(`Credit ID: ${c.id}, Client: ${c.client.name}, Grams: ${c.grams}, Settled: ${c.settledGrams}, Status: ${c.status}`));

    const movements = await prisma.pureMetalLotMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { pureMetalLot: { select: { lotNumber: true } } }
    });
    console.log("\n=== Last Pure Metal Lot Movements ===");
    movements.forEach((m: any) => console.log(`Movement ID: ${m.id}, Lot: ${m.pureMetalLot?.lotNumber}, Type: ${m.type}, Grams: ${m.grams}, Notes: ${m.notes}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
