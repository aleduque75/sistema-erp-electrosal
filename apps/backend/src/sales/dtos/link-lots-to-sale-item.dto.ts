import { IsArray, IsNotEmpty, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LotInfo {
  @IsUUID()
  @IsNotEmpty()
  inventoryLotId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class LinkLotsToSaleItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotInfo)
  lots: LotInfo[];
}
