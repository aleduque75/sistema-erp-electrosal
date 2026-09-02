import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { StockUnit } from '@prisma/client';

export class CreateProductDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() stock!: number;
  @IsEnum(StockUnit) @IsOptional() stockUnit?: StockUnit;
  @IsNumber() @IsOptional() costPrice?: number;
  @IsNumber() @IsOptional() goldValue?: number;
  @IsUUID() @IsOptional() productGroupId?: string;
}

export { UpdateProductDto } from './update-product.dto';
export { ImportXmlDto, ConfirmImportXmlDto } from './import-xml.dto';
export class ManualMatchesDto {
  [xmlName: string]: string;
}