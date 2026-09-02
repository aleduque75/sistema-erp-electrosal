import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  productGroupId?: string;
}
