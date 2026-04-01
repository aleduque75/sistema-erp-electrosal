import { IsNumber, IsString, IsOptional, IsDateString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SellPureMetalLotDto {
  @ApiProperty({ description: 'Quantidade em gramas a vender', example: 10.5 })
  @IsNumber()
  @Min(0.01)
  grams: number;

  @ApiPropertyOptional({ description: 'Preço por grama', example: 350.50 })
  @IsNumber()
  @IsOptional()
  pricePerGram?: number;

  @ApiProperty({ description: 'Valor total da venda', example: 3680.25 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Data da venda', example: '2023-10-27T12:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'ID do cliente', example: 'uuid-do-cliente' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: 'Observações da venda', example: 'Venda direta de ouro puro' })
  @IsString()
  @IsOptional()
  notes?: string;
}
