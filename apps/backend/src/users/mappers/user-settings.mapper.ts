import { UserSettings, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { UserSettings as PrismaUserSettings } from '@prisma/client';

export class UserSettingsMapper {
  static toDomain(raw: PrismaUserSettings): UserSettings {
    return UserSettings.create(
      {
        userId: raw.userId,
        defaultReceitaContaId: raw.defaultReceitaContaId ?? undefined,
        defaultCaixaContaId: raw.defaultCaixaContaId ?? undefined,
        defaultDespesaContaId: raw.defaultDespesaContaId ?? undefined,
        metalStockAccountId: raw.metalStockAccountId ?? undefined,
        productionCostAccountId: raw.productionCostAccountId ?? undefined,
        metalCreditPayableAccountId: raw.metalCreditPayableAccountId ?? undefined,
      },
      raw.id ? UniqueEntityID.create(raw.id) : undefined,
    );
  }

  static toPersistence(userSettings: UserSettings): PrismaUserSettings {
    return {
      id: userSettings.id.toString(),
      userId: userSettings.userId,
      defaultReceitaContaId: userSettings.defaultReceitaContaId ?? null,
      defaultCaixaContaId: userSettings.defaultCaixaContaId ?? null,
      defaultDespesaContaId: userSettings.defaultDespesaContaId ?? null,
      metalStockAccountId: userSettings.metalStockAccountId ?? null,
      productionCostAccountId: userSettings.productionCostAccountId ?? null,
      metalCreditPayableAccountId: userSettings.metalCreditPayableAccountId ?? null,
    } as PrismaUserSettings; // Cast to PrismaUserSettings to satisfy type checking
  }
}
