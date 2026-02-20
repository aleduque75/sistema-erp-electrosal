import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) { }

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
        }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.landingPage.update({
        where: { id: lp.id },
        data: {
          logoText: dto.logoText,
          logoImageId: dto.logoImageId,
        },
      });

      if (dto.sections) {
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