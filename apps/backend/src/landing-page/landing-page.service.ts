import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.landingPage.findFirst({
      where: { name: 'default' },
      include: { sections: { orderBy: { order: 'asc' } } }, // 👈 Crucial para o site carregar na ordem
    });
  }

  async findOneByOrg(organizationId: string) {
    return this.prisma.landingPage.findFirst({
      where: { organizationId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
  }

  async update(organizationId: string, dto: UpdateLandingPageDto) {
    const lp = await this.prisma.landingPage.findFirst({ where: { organizationId } });
    if (!lp) throw new NotFoundException('Landing Page não encontrada');

    return this.prisma.$transaction(async (tx) => {
      await tx.landingPage.update({
        where: { id: lp.id },
        data: { logoText: dto.logoText, themePreference: 'dark' },
      });

      if (dto.sections) {
        await tx.section.deleteMany({ where: { landingPageId: lp.id } });
        for (let i = 0; i < dto.sections.length; i++) {
          await tx.section.create({
            data: {
              landingPageId: lp.id,
              type: dto.sections[i].type,
              order: i, // ✅ Usa o índice do array como ordem oficial
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