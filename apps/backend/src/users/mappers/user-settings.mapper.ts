import { UserSettings as PrismaUserSettings } from '@prisma/client';
import { UserSettings } from '@sistema-erp-electrosal/core';

export class UserSettingsMapper {
  /**
   * Converte o objeto cru do Prisma (Banco de Dados) para a Entidade de Domínio (Core).
   * Use este método quando buscar dados do banco.
   */
  static toDomain(raw: PrismaUserSettings): UserSettings {
    return UserSettings.create(
      {
        userId: raw.userId,
        theme: raw.theme, // <-- Vincula o novo campo de tema
        language: raw.language, // <-- Vincula o novo campo de idioma
        defaultCaixaContaId: raw.defaultCaixaContaId,
        defaultDespesaContaId: raw.defaultDespesaContaId,
        defaultReceitaContaId: raw.defaultReceitaContaId,
        metalStockAccountId: raw.metalStockAccountId,
        productionCostAccountId: raw.productionCostAccountId,
        metalCreditPayableAccountId: raw.metalCreditPayableAccountId,
      },
      raw.id, // Mantém o ID original do banco na entidade
    );
  }

  /**
   * Converte a Entidade de Domínio para o formato que o Prisma entende.
   * Use este método ao salvar ou atualizar no banco.
   */
  static toPersistence(userSettings: UserSettings): any {
    return {
      id: userSettings.id,
      userId: userSettings.userId,
      theme: userSettings.theme, // <-- Prepara para salvar
      language: userSettings.language,
      defaultCaixaContaId: userSettings.defaultCaixaContaId,
      defaultDespesaContaId: userSettings.defaultDespesaContaId,
      defaultReceitaContaId: userSettings.defaultReceitaContaId,
      metalStockAccountId: userSettings.metalStockAccountId,
      productionCostAccountId: userSettings.productionCostAccountId,
      metalCreditPayableAccountId: userSettings.metalCreditPayableAccountId,
    };
  }
}
