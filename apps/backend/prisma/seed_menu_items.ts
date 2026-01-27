import { PrismaClient } from '@prisma/client';
import { menuConfig, NavItem } from '../../frontend/src/config/menu'; // Adjust path as needed
import { Settings } from 'lucide-react'; // Import the Settings icon

const prisma = new PrismaClient();

async function main() {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || (await prisma.organization.findFirst())?.id;

  if (!organizationId) {
    console.error('Nenhuma organização encontrada ou DEFAULT_ORGANIZATION_ID não definido.');
    return;
  }

  // Function to map Lucide React icons to string names
  const getIconName = (iconComponent: React.ElementType | undefined): string | undefined => {
    if (!iconComponent) return undefined;
    const iconName = (iconComponent as any).displayName || (iconComponent as any).name;
    // console.log(`Icon component: ${JSON.stringify(iconComponent)}, Extracted name: ${iconName}`);
    return iconName;
  };

  // Find the "Administração" section and add "Gerenciar Menu"
  const administracaoSection = menuConfig.find(item => item.title === 'Administração');

  if (administracaoSection && administracaoSection.subItems) {
    const gerenciarMenuItemExists = administracaoSection.subItems.some(subItem => subItem.title === 'Gerenciar Menu');

    if (!gerenciarMenuItemExists) {
      administracaoSection.subItems.push({
        title: 'Gerenciar Menu',
        href: '/admin/menu',
        icon: Settings,
        description: 'Gerencie a estrutura do menu de navegação.',
        order: 99,
      });
      administracaoSection.subItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } else {
    console.warn("Seção 'Administração' não encontrada no menuConfig. Certifique-se de que a estrutura esteja correta.");
  }


  const seedMenuItems = async (items: NavItem[], parentId: string | null = null, orderOffset: number = 0) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      let menuItem;
      if (parentId === null) {
        menuItem = await prisma.menuItem.findFirst({
          where: { organizationId, title: item.title, parentId: null },
        });
      } else {
        menuItem = await prisma.menuItem.findUnique({
          where: {
            organizationId_title_parentId: {
              organizationId: organizationId,
              title: item.title,
              parentId: parentId,
            },
          },
        });
      }

      const data = {
        title: item.title,
        href: item.href,
        icon: getIconName(item.icon),
        order: i + orderOffset,
        disabled: item.disabled || false,
        organizationId: organizationId,
        parentId: parentId,
      };

      if (menuItem) {
        menuItem = await prisma.menuItem.update({
          where: { id: menuItem.id },
          data,
        });
      } else {
        menuItem = await prisma.menuItem.create({
          data,
        });
      }

      if (item.subItems && item.subItems.length > 0) {
        await seedMenuItems(item.subItems, menuItem.id);
      }
    }
  };

  await prisma.menuItem.deleteMany({
    where: { organizationId: organizationId },
  });

  await seedMenuItems(menuConfig);
  console.log('Menu items seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
