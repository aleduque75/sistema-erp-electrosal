// apps/backend/src/settings/dto/update-setting.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';

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
}