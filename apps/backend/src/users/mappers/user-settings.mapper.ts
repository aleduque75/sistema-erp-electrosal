import { UserSettings } from '@sistema-beleza/core';
import { UserSettings as PrismaUserSettings } from '@prisma/client';

export class UserSettingsMapper {
  static toDomain(raw: PrismaUserSettings): UserSettings {
    return UserSettings.create(
      {
        userId: raw.userId,
        defaultReceitaContaId: raw.defaultReceitaContaId ?? undefined,
        defaultCaixaContaId: raw.defaultCaixaContaId ?? undefined,
        defaultDespesaContaId: raw.defaultDespesaContaId ?? undefined,
        // createdAt and updatedAt are not in Prisma model for UserSettings,
        // but are in our DDD entity. We can omit them or add default values if needed.
      },
      raw.id,
    );
  }

  static toPersistence(userSettings: UserSettings): PrismaUserSettings {
    return {
      id: userSettings.id.toString(),
      userId: userSettings.userId,
      defaultReceitaContaId: userSettings.defaultReceitaContaId ?? null,
      defaultCaixaContaId: userSettings.defaultCaixaContaId ?? null,
      defaultDespesaContaId: userSettings.defaultDespesaContaId ?? null,
    } as PrismaUserSettings; // Cast to PrismaUserSettings to satisfy type checking
  }
}
