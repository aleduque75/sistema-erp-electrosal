import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const UPLOADS_DIR = join(process.cwd(), 'uploads');

async function migrate() {
  console.log('🚀 Iniciando migração de nomes de arquivos...');

  try {
    const medias = await prisma.media.findMany();

    for (const media of medias) {
      if (!media.filename) continue;

      const extension = media.filename.split('.').pop();
      const newFilename = `${media.id}.${extension}`;

      const oldPath = join(UPLOADS_DIR, media.filename);
      const newPath = join(UPLOADS_DIR, newFilename);

      // Renomeia no disco se o arquivo antigo existir
      if (fs.existsSync(oldPath) && media.filename !== newFilename) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Disco: ${media.filename} -> ${newFilename}`);
        } catch (err) {
          console.error(`❌ Erro no arquivo ${media.filename}:`, err.message);
        }
      }

      // Atualiza o banco de dados
      await prisma.media.update({
        where: { id: media.id },
        data: {
          filename: newFilename,
          path: `/uploads/${newFilename}`,
        },
      });
    }
    console.log('✨ Migração concluída com sucesso!');
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
