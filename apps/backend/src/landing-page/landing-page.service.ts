import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LandingPage, Prisma } from '@prisma/client';

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) {}

  async findOne(): Promise<LandingPage> {
    let landingPage = await this.prisma.landingPage.findUnique({
      where: { name: 'default' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        logoImage: true, // Inclui os dados da imagem do logotipo
      },
    });

    // Se não existir, cria uma landing page padrão
    if (!landingPage) {
      landingPage = await this.prisma.landingPage.create({
        data: {
          name: 'default',
          logoText: 'Sistema Beleza', // Texto padrão do logotipo
          logoImageId: null, // ID da imagem do logotipo (inicialmente nulo)
          sections: {
            create: [
              {
                order: 1,
                type: 'hero',
                content: {
                  title: 'Gestão Completa para seu Salão de Beleza',
                  description:
                    'Agendamentos, clientes, estoque e financeiro em um só lugar. Foque na beleza, nós cuidamos da organização.',
                  mainImage: '', // Será preenchido com ID de mídia
                  sideImages: [], // Será preenchido com IDs de mídia
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
                    'Tudo o que você precisa para gerenciar seu salão com eficiência e encantar seus clientes.',
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
          logoImage: true, // Inclui os dados da imagem do logotipo
        },
      });
    }
    return landingPage;
  }

  async update(
    sectionsData: {
      id?: string;
      order: number;
      type: string;
      content: Prisma.JsonValue;
    }[],
    logoText?: string | null, // Novo parâmetro
    logoImageId?: string | null, // Novo parâmetro
  ): Promise<LandingPage> {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { name: 'default' },
      include: { sections: true }, // Incluir seções existentes para comparação
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
          logoImage: true, // Inclui os dados da imagem do logotipo
        },
      }) as Promise<LandingPage>;
    });
  }
}
