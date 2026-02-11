import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuItem as PrismaMenuItem } from '@prisma/client';

interface MenuItem extends PrismaMenuItem {
  subItems?: MenuItem[];
}

export interface FullMenuResponse {
  menuItems: MenuItem[];
  logoImage?: { path: string, id: string };
  logoText?: string;
}

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createMenuDto: CreateMenuDto): Promise<PrismaMenuItem> {
    return this.prisma.menuItem.create({
      data: {
        ...createMenuDto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<FullMenuResponse> {
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

    return {
      menuItems: menuItems,
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

  async reorder(organizationId: string, items: { id: string, order: number }[]): Promise<{ count: number }> {
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
          data: { order: item.order },
        });
        updatedCount++;
      }
      return { count: updatedCount };
    });
  }
}
