import { IsOptional, IsUUID, IsEnum, IsString } from 'class-validator';
import { StatusAnaliseQuimica } from '../../enums/status-analise-quimica.enum';
import { TipoMetal } from '../../enums/tipo-metal.enum';

export class ListarAnalisesQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente deve ser um UUID válido.' })
  clienteId?: string;

  @IsOptional()
  @IsEnum(TipoMetal)
  metalType?: TipoMetal;

  @IsOptional()
  @IsEnum(StatusAnaliseQuimica, {
    message: 'Status da análise química inválido.',
  })
  status?: StatusAnaliseQuimica;

  @IsOptional()
  @IsString()
  numeroAnalise?: string;
}
