import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsEnum(['ADMIN', 'USER'])
  @IsOptional()
  role?: 'ADMIN' | 'USER';
}
