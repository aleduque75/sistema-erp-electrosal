// apps/backend/prisma/seed-theme-presets.ts

import { PrismaClient } from '../src/generated/client'; // Importar do local gerado
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed para presets de tema...');

  const orgId = '2a5bb448-056b-4b87-b02f-fec691dd658d'; 

  const electrosalLightPresetData = {
    "light": {
      "colors": {
        "foreground": "222 47% 11%",
        "mutedForeground": "215 16% 47%",
        "background": "0 0% 100%",
        "card": "0 0% 100%",
        "cardBorder": "214 32% 91%",
        "cardBorderOpacity": "1",
        "cardRadius": "12px",
        "border": "214 32% 91%",
        "input": "210 40% 98%",
        "inputForeground": "222 47% 11%",
        "ring": "221 83% 70%",
        "menuBackground": "0 0% 100%",
        "menuText": "215 25% 27%",
        "menuBgHover": "210 40% 96%",
        "menuSelectedBackground": "221 83% 95%",
        "menuSelectedText": "221 83% 45%",
        "menuBorder": "214 32% 91%",
        "menuBorderOpacity": "1",
        "menuItemRadius": "8px",
        "badgeBackground": "221 83% 53%",
        "badgeText": "0 0% 100%",
        "primary": "221 83% 53%",
        "primaryForeground": "0 0% 100%",
        "primaryHover": "221 83% 45%",
        "cancel": "215 16% 47%",
        "cancelHover": "215 16% 40%",
        "cancelForeground": "0 0% 100%",
        "buttonRadius": "8px"
      }
    },
    "dark": {
      "colors": {
        "foreground": "210 40% 98%",
        "mutedForeground": "215 20% 65%",
        "background": "222 47% 11%",
        "card": "222 47% 12%",
        "cardBorder": "217 33% 25%",
        "cardBorderOpacity": "0.5",
        "border": "217 33% 17%",
        "input": "217 33% 18%",
        "inputForeground": "210 40% 98%",
        "primary": "221 83% 60%",
        "primaryForeground": "0 0% 100%",
        "primaryHover": "221 83% 70%",
        "cancel": "215 16% 55%",
        "cancelHover": "215 16% 65%",
        "cancelForeground": "0 0% 100%",
        "ring": "221 83% 70%",
        "menuBackground": "222 47% 11%",
        "menuText": "210 40% 98%",
        "menuBorder": "217 33% 17%",
        "badgeBackground": "221 83% 60%",
        "badgeText": "0 0% 100%"
      }
    }
  };

  const electrosalDarkPresetData = {
    "light": {
      "colors": {
        "foreground": "222 47% 11%",
        "mutedForeground": "215 16% 47%",
        "background": "0 0% 100%",
        "card": "0 0% 100%",
        "cardBorder": "214 32% 91%",
        "cardBorderOpacity": "1",
        "cardRadius": "12px",
        "border": "214 32% 91%",
        "input": "210 40% 98%",
        "inputForeground": "222 47% 11%",
        "ring": "221 83% 70%",
        "menuBackground": "0 0% 100%",
        "menuText": "215 25% 27%",
        "menuBgHover": "210 40% 96%",
        "menuSelectedBackground": "221 83% 95%",
        "menuSelectedText": "221 83% 45%",
        "menuBorder": "214 32% 91%",
        "menuBorderOpacity": "1",
        "menuItemRadius": "8px",
        "badgeBackground": "221 83% 53%",
        "badgeText": "0 0% 100%",
        "primary": "221 83% 53%",
        "primaryForeground": "0 0% 100%",
        "primaryHover": "221 83% 45%",
        "cancel": "215 16% 47%",
        "cancelHover": "215 16% 40%",
        "cancelForeground": "0 0% 100%",
        "buttonRadius": "8px"
      }
    },
    "dark": {
      "colors": {
        "foreground": "210 40% 98%",
        "mutedForeground": "215 20% 65%",
        "background": "222 47% 11%",
        "card": "222 47% 12%",
        "cardBorder": "217 33% 25%",
        "cardBorderOpacity": "0.5",
        "border": "217 33% 17%",
        "input": "217 33% 18%",
        "inputForeground": "210 40% 98%",
        "primary": "221 83% 60%",
        "primaryForeground": "0 0% 100%",
        "primaryHover": "221 83% 70%",
        "cancel": "215 16% 55%",
        "cancelHover": "215 16% 65%",
        "cancelForeground": "0 0% 100%",
        "ring": "221 83% 70%",
        "menuBackground": "222 47% 11%",
        "menuText": "210 40% 98%",
        "menuBorder": "217 33% 17%",
        "badgeBackground": "221 83% 60%",
        "badgeText": "0 0% 100%"
      }
    }
  };

  // Preset Electrosal Light
  await prisma.themePreset.upsert({
    where: { organizationId_name: { organizationId: orgId, name: 'Electrosal Light' } },
    update: {},
    create: {
      organizationId: orgId,
      name: 'Electrosal Light',
      presetData: electrosalLightPresetData as any,
      isDefault: true,
    },
  });

  // Preset Electrosal Dark
  await prisma.themePreset.upsert({
    where: { organizationId_name: { organizationId: orgId, name: 'Electrosal Dark' } },
    update: {},
    create: {
      organizationId: orgId,
      name: 'Electrosal Dark',
      presetData: electrosalDarkPresetData as any,
      isDefault: true,
    },
  });

  console.log('Presets de tema padrão criados/atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });