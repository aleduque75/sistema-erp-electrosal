import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AddRawMaterialDto {
  @IsString()
  @IsNotEmpty()
  rawMaterialId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  costInAu?: number;

  @IsNumber()
  @IsOptional()
  costInBrl?: number;
}
