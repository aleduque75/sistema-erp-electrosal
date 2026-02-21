
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = "2a5bb448-056b-4b87-b02f-fec691dd658d";
    console.log(`Buscando AppearanceSettings para Org: ${orgId}`);

    const settings = await prisma.appearanceSettings.findUnique({
        where: { organizationId: orgId },
    });

    if (settings) {
        console.log("Configurações Encontradas:");
        console.log(JSON.stringify(settings, null, 2));
    } else {
        console.log("Nenhuma configuração encontrada para esta organização.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
