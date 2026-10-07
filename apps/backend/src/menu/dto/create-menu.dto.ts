import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateIf } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  href: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsNotEmpty()
  order: number;

  @IsBoolean()
  @IsOptional()
  disabled?: boolean;

  @ValidateIf((o) => o.parentId !== null && o.parentId !== undefined)
  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedSectors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedRoles?: string[];
}
