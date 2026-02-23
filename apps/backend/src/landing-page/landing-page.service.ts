import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

import { MediaService } from '../media/media.service';

@Injectable()
export class LandingPageService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) { }

  async findPublic() {
    // Busca a landing page atualizada mais recentemente que possua seções.
    // Isso garante que o que o usuário acabou de salvar no manager seja o que aparece no site.
    return this.prisma.landingPage.findFirst({
      where: {
        sections: { some: {} } // Garante que tem pelo menos uma seção
      },
      orderBy: { updatedAt: 'desc' },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
  }

  async findOneByOrg(organizationId: string) {
    let lp = await this.prisma.landingPage.findFirst({
      where: { organizationId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    // Se não existir, criamos uma entrada básica para evitar erro 404 no manager
    if (!lp) {
      lp = await this.prisma.landingPage.create({
        data: {
          organizationId,
          name: 'Nova Landing Page',
          logoText: 'Minha Empresa',
          highlights: [], // Inicializa vazio
        },
        include: { sections: { orderBy: { order: 'asc' } } },
      });
    }

    return lp;
  }

  async update(organizationId: string, dto: UpdateLandingPageDto) {
    const lp = await this.prisma.landingPage.findFirst({
      where: { organizationId },
    });

    if (!lp) {
      // Caso não exista (segurança), cria antes de atualizar
      return this.prisma.landingPage.create({
        data: {
          organizationId,
          logoText: dto.logoText,
          logoImageId: dto.logoImageId,
          highlights: dto.highlights || [],
        }
      });
    }

    // --- Lógica para deletar logo antigo se substituído ---
    if (dto.logoImageId && lp.logoImageId && lp.logoImageId !== dto.logoImageId) {
      console.log(`[LandingPageService] Logo substituído de ${lp.logoImageId} para ${dto.logoImageId}. Excluindo antigo...`);
      await this.mediaService.remove(lp.logoImageId).catch(err => {
        console.error(`[LandingPageService] Erro ao deletar logo antigo ${lp.logoImageId}:`, err);
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.landingPage.update({
        where: { id: lp.id },
        data: {
          logoText: dto.logoText,
          logoImageId: dto.logoImageId,
          highlights: dto.highlights,
        },
      });

      if (dto.sections) {
        const oldSections = await tx.section.findMany({
          where: { landingPageId: lp.id }
        });

        // Tenta identificar mídias dentro do JSON das seções antigas
        for (const section of oldSections) {
          const content = section.content as any;
          if (content?.imageId) {
            console.log(`[LandingPageService] Limpando imagem da seção deletada: ${content.imageId}`);
            await this.mediaService.remove(content.imageId).catch(() => { });
          }
        }

        // Remove as seções antigas e insere as novas para manter a ordem limpa
        await tx.section.deleteMany({ where: { landingPageId: lp.id } });

        for (let i = 0; i < dto.sections.length; i++) {
          await tx.section.create({
            data: {
              landingPageId: lp.id,
              type: dto.sections[i].type,
              order: i,
              content: dto.sections[i].content as any,
            },
          });
        }
      }

      return tx.landingPage.findUnique({
        where: { id: lp.id },
        include: { sections: { orderBy: { order: 'asc' } } },
      });
    });
  }
}