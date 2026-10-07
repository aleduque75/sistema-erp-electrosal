import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuItem as PrismaMenuItem } from '@prisma/client';

export interface MenuItem extends PrismaMenuItem {
  subItems?: MenuItem[];
}

export interface FullMenuResponse {
  menuItems: MenuItem[];
  logoImage?: { path: string, id: string };
  logoText?: string;
}

@Injectable()
export class MenuService implements OnApplicationBootstrap {
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.ensureMenuStructure();
  }

  async ensureMenuStructure() {
    try {
      const orgs = await this.prisma.organization.findMany({ select: { id: true } });
      for (const org of orgs) {
        // Encontra ou cria a categoria pai "Produção / Laboratório"
        let producaoParent = await this.prisma.menuItem.findFirst({
          where: {
            organizationId: org.id,
            parentId: null,
            OR: [
              { title: { contains: 'Produção', mode: 'insensitive' } },
              { title: { contains: 'Laboratório', mode: 'insensitive' } },
            ],
          },
        });

        if (!producaoParent) {
          const maxOrder = await this.prisma.menuItem.aggregate({
            where: { organizationId: org.id, parentId: null },
            _max: { order: true },
          });
          const nextOrder = (maxOrder._max.order ?? 0) + 1;

          producaoParent = await this.prisma.menuItem.create({
            data: {
              organizationId: org.id,
              title: 'Produção / Laboratório',
              href: '#',
              icon: 'FlaskConical',
              order: nextOrder,
              disabled: false,
            },
          });
          console.log(`[MenuService] Categoria 'Produção / Laboratório' criada com sucesso para organização ${org.id}`);
        }

        // Encontrar item de "Recuperações" (por href ou title)
        const recuperacaoItem = await this.prisma.menuItem.findFirst({
          where: {
            organizationId: org.id,
            OR: [
              { href: '/recovery-orders' },
              { title: { contains: 'Recuperaç', mode: 'insensitive' } },
            ],
          },
        });

        if (recuperacaoItem && recuperacaoItem.parentId !== producaoParent.id) {
          const currentCount = await this.prisma.menuItem.count({
            where: { organizationId: org.id, parentId: producaoParent.id },
          });

          await this.prisma.menuItem.update({
            where: { id: recuperacaoItem.id },
            data: {
              parentId: producaoParent.id,
              order: currentCount,
            },
          });
          console.log(`[MenuService] Item '${recuperacaoItem.title}' movido para '${producaoParent.title}' (Org: ${org.id})`);
        }
      }
    } catch (err) {
      console.warn('[MenuService] Aviso ao verificar/atualizar estrutura de menu:', err);
    }
  }

  async create(organizationId: string, createMenuDto: CreateMenuDto): Promise<PrismaMenuItem> {
    return this.prisma.menuItem.create({
      data: {
        ...createMenuDto,
        organizationId,
      },
    });
  }

  private filterItems(items: MenuItem[], user: any): MenuItem[] {
    if (!user) return items;
    if (user.role === 'ADMIN') return items; // Admin vê tudo

    const userSector = user.sector || 'GERAL';
    const userRole = user.role || 'USER';

    return items
      .filter(item => {
        if (item.disabled) return false;

        // Filtrar por setor
        if (item.allowedSectors && item.allowedSectors.length > 0) {
          if (!item.allowedSectors.includes(userSector)) {
            return false;
          }
        }

        // Filtrar por cargo
        if (item.allowedRoles && item.allowedRoles.length > 0) {
          if (!item.allowedRoles.includes(userRole)) {
            return false;
          }
        }

        return true;
      })
      .map(item => {
        if (item.subItems && item.subItems.length > 0) {
          return {
            ...item,
            subItems: this.filterItems(item.subItems, user)
          };
        }
        return item;
      });
  }

  async findAll(organizationId: string, user?: any): Promise<FullMenuResponse> {
    const [menuItems, landingPage] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: { organizationId, parentId: null },
        orderBy: { order: 'asc' },
        include: {
          subItems: {
            orderBy: { order: 'asc' },
            include: {
              subItems: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.landingPage.findFirst({
        where: { name: 'default' }, // Assuming a default landing page
        include: { logoImage: true },
      }),
    ]);

    const filteredItems = this.filterItems(menuItems as MenuItem[], user);

    return {
      menuItems: filteredItems,
      logoImage: landingPage?.logoImage ? { path: landingPage.logoImage.path, id: landingPage.logoImage.id } : undefined,
      logoText: landingPage?.logoText || 'Sistema',
    };
  }

  async findOne(organizationId: string, id: string): Promise<MenuItem> {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id, organizationId },
      include: {
        subItems: true,
      },
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu Item with ID ${id} not found.`);
    }
    return menuItem;
  }

  async update(organizationId: string, id: string, updateMenuDto: UpdateMenuDto): Promise<PrismaMenuItem> {
    await this.findOne(organizationId, id);
    return this.prisma.menuItem.update({
      where: { id },
      data: updateMenuDto,
    });
  }

  async remove(organizationId: string, id: string): Promise<PrismaMenuItem> {
    await this.findOne(organizationId, id);
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async reorder(organizationId: string, items: { id: string, order: number, parentId?: string | null }[]): Promise<{ count: number }> {
    return this.prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      for (const item of items) {
        if (updatedCount === 0) {
            const firstItem = await tx.menuItem.findFirst({ where: { id: item.id, organizationId } });
            if (!firstItem) {
                throw new NotFoundException(`Menu item with id ${item.id} not found in this organization.`);
            }
        }
        
        await tx.menuItem.update({
          where: { id: item.id },
          data: {
            order: item.order,
            ...(item.parentId !== undefined ? { parentId: item.parentId } : {}),
          },
        });
        updatedCount++;
      }
      return { count: updatedCount };
    });
  }
}
