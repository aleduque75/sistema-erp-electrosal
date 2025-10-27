import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class AddRawMaterialDto {
  @IsString()
  @IsNotEmpty()
  rawMaterialId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
