import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListPessoasQueryDto {
  @IsOptional()
  @IsEnum(['CLIENT', 'FORNECEDOR', 'FUNCIONARIO'], {
    message: 'O papel deve ser CLIENT, FORNECEDOR ou FUNCIONARIO.',
  })
  role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO';

  @IsOptional()
  @IsString()
  search?: string;
}
