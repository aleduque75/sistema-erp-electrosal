import { Injectable, NotFoundException } from '@nestjs/common';
import { LandingPage, Prisma, Media, Section } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LandingPageWithRelations = LandingPage & {
  sections: Section[];
  logoImage: Media | null;
};

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) {}

  async findOne(hydrate = true): Promise<LandingPageWithRelations> {
    let landingPage = await this.prisma.landingPage.findUnique({
      where: { name: 'default' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        logoImage: true,
      },
    });

    // Se não existir, cria uma landing page padrão
    if (!landingPage) {
      try {
        landingPage = await this.prisma.landingPage.create({
          data: {
            name: 'default',
            logoText: 'Sistema Electrosal - Erp',
            logoImageId: null,
            customThemeName: null, // Changed from customTheme to customThemeName
            sections: {
              create: [
                {
                  order: 1,
                  type: 'hero',
                  content: {
                    title: 'Gestão Completa para sua galvânica',
                    description:
                      'Agendamentos, clientes, estoque e financeiro em um só lugar. Foque no seu negócio, nós cuidamos da organização.',
                    mainImage: '',
                    sideImages: [],
                    ctaButtonText: 'Entrar no Sistema',
                    ctaButtonLink: '/login',
                    secondaryButtonText: 'Ver Funcionalidades',
                    secondaryButtonLink: '#features',
                  },
                },
                {
                  order: 2,
                  type: 'features',
                  content: {
                    title: 'Funcionalidades Principais',
                    description:
                      'Tudo o que você precisa para gerenciar sua galvânica com eficiência e simplicidade.',
                    items: [
                      {
                        icon: 'CalendarCheck',
                        title: 'Agenda Inteligente',
                        description:
                          'Organize seus horários, evite conflitos e envie lembretes automáticos para seus clientes.',
                      },
                      {
                        icon: 'Users',
                        title: 'Cadastro de Clientes',
                        description:
                          'Mantenha um histórico completo de serviços, preferências e informações de contato para um atendimento VIP.',
                      },
                      {
                        icon: 'BarChart3',
                        title: 'Financeiro Descomplicado',
                        description:
                          'Controle suas contas a pagar, receber, faturas de cartão e veja gráficos que mostram a saúde do seu negócio.',
                      },
                    ],
                  },
                },
              ],
            },
          },
          include: {
            sections: {
              orderBy: { order: 'asc' },
            },
            logoImage: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // A landing page foi criada por outra requisição, podemos buscá-la
          landingPage = await this.prisma.landingPage.findUnique({
            where: { name: 'default' },
            include: {
              sections: {
                orderBy: { order: 'asc' },
              },
              logoImage: true,
            },
          });
        } else {
          // Se for outro erro, relança
          throw error;
        }
      }
    }

    // Hidratar caminhos de imagem para seções Hero, se solicitado
    if (hydrate && landingPage && landingPage.sections) {
      // Create a deep copy to avoid modifying the original Prisma object and prevent circular references
      const hydratedLandingPage = JSON.parse(JSON.stringify(landingPage)) as LandingPageWithRelations;

      /*
      for (const section of hydratedLandingPage.sections) {
        if (section.type === 'hero' && section.content) {
          const heroContent = section.content as any; // Usar any para acessar propriedades dinamicamente
          if (heroContent.mainImage) {
            const mainMedia = await this.prisma.media.findUnique({ where: { id: heroContent.mainImage } });
            if (mainMedia) {
              heroContent.mainImage = mainMedia.path; // Substitui o ID pelo caminho
            }
          }
          if (heroContent.sideImages && Array.isArray(heroContent.sideImages)) {
            const sideMediaPromises = heroContent.sideImages.map(async (id: string) => {
              const media = await this.prisma.media.findUnique({ where: { id } });
              return media ? media.path : null;
            });
            heroContent.sideImages = (await Promise.all(sideMediaPromises)).filter(Boolean); // Substitui IDs por caminhos, remove nulos
          }
        }
      }
      */
      return hydratedLandingPage;
    }

    return landingPage as LandingPageWithRelations; // Cast para o tipo correto
  }

  async update(
    sectionsData: {
      id?: string;
      order: number;
      type: string;
      content: Prisma.JsonValue;
    }[],
    logoText?: string | null,
    logoImageId?: string | null,
    customThemeName?: string | null, // Changed from customTheme to customThemeName
  ): Promise<LandingPageWithRelations> { // Updated return type
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { name: 'default' },
      include: { sections: true },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing Page padrão não encontrada.');
    }

    // Transação para garantir atomicidade
    return this.prisma.$transaction(async (tx) => {
      // Atualiza os campos de logotipo da LandingPage
      await tx.landingPage.update({
        where: { id: landingPage.id },
        data: {
          logoText: logoText,
          logoImageId: logoImageId,
          customThemeName: customThemeName, // Changed from customTheme to customThemeName
        },
      });

      // Deleta seções que não estão mais presentes
      const existingSectionIds = landingPage.sections.map((s) => s.id);
      const updatedSectionIds = sectionsData
        .filter((s) => s.id)
        .map((s) => s.id!); // Filtra apenas IDs de seções existentes

      const sectionsToDelete = existingSectionIds.filter(
        (id) => !updatedSectionIds.includes(id),
      );

      if (sectionsToDelete.length > 0) {
        await tx.section.deleteMany({
          where: {
            id: { in: sectionsToDelete },
            landingPageId: landingPage.id,
          },
        });
      }

      // Cria ou atualiza seções
      for (const section of sectionsData) {
        if (section.id) {
          // Atualiza
          await tx.section.update({
            where: { id: section.id },
            data: {
              order: section.order,
              type: section.type,
              content: section.content as Prisma.InputJsonValue,
            },
          });
        } else {
          // Cria
          await tx.section.create({
            data: {
              landingPageId: landingPage.id,
              order: section.order,
              type: section.type,
              content: section.content as Prisma.InputJsonValue,
            },
          });
        }
      }

      // Retorna a landing page atualizada
      return tx.landingPage.findUnique({
        where: { id: landingPage.id },
        include: {
          sections: { orderBy: { order: 'asc' } },
          logoImage: true,
        },
      }) as Promise<LandingPageWithRelations>; // Cast para o tipo correto
    });
  }
}