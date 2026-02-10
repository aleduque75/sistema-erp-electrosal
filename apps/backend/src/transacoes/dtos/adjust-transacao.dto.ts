import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class AdjustTransactionDto {
  @IsNotEmpty()
  @IsUUID()
  newContaCorrenteId: string;

  @IsNotEmpty()
  @IsNumber()
  newGoldAmount: number;
}
