import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando limpeza total de mídias...');

    // 1. Limpar Banco de Dados
    console.log('🗄️ Apagando registros da tabela Media...');
    // Nota: DeleteMany é seguro aqui pois as relações são opcionais
    const result = await prisma.media.deleteMany({});
    console.log(`✅ ${result.count} registros de mídia removidos do banco.`);

    // 2. Limpar Arquivos Físicos
    const uploadsDir = path.join(process.cwd(), 'uploads');
    console.log(`📁 Limpando arquivos físicos em: ${uploadsDir}`);

    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        let count = 0;
        for (const file of files) {
            // Pula arquivos ocultos ou de sistema se necessário
            if (file.startsWith('.')) continue;

            const filePath = path.join(uploadsDir, file);
            try {
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    count++;
                }
            } catch (err) {
                console.error(`❌ Erro ao apagar ${file}:`, err);
            }
        }
        console.log(`✅ ${count} arquivos físicos removidos.`);
    } else {
        console.log('⚠️ Diretório de uploads não encontrado.');
    }

    console.log('✨ Limpeza concluída!');
}

main()
    .catch((e) => {
        console.error('❌ Erro durante a limpeza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
