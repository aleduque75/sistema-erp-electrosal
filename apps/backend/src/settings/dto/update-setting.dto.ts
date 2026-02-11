import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

/**
 * DTO para atualização das configurações de preferência do usuário.
 * Define as validações necessárias para os campos de contas contábeis e tema visual.
 */
export class UpdateSettingDto {
  @IsUUID()
  @IsOptional()
  defaultReceitaContaId?: string;

  @IsUUID()
  @IsOptional()
  defaultCaixaContaId?: string;

  @IsUUID()
  @IsOptional()
  defaultDespesaContaId?: string;

  @IsUUID()
  @IsOptional()
  metalStockAccountId?: string;

  @IsUUID()
  @IsOptional()
  productionCostAccountId?: string;

  @IsUUID()
  @IsOptional()
  metalCreditPayableAccountId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'system'], {
    message: 'O tema deve ser "light", "dark" ou "system".',
  })
  theme?: string;
}
