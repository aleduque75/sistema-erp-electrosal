import { IsArray, IsString, IsInt, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItemDto {
  @IsString()
  id: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class ReorderMenuDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
