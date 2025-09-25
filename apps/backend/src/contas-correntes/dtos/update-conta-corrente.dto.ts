import { IsNumber, IsOptional } from 'class-validator';

export class UpdateContaCorrenteDto {
  @IsOptional()
  @IsNumber()
  initialBalanceBRL?: number;

  @IsOptional()
  @IsNumber()
  initialBalanceGold?: number;
}
