import { IsString, IsDate, IsNumber, Min, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '../../enums/tipo-metal.enum';

export class UpdateAnaliseQuimicaDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsEnum(TipoMetal)
  metalType?: TipoMetal;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataEntrada?: Date;

  @IsOptional()
  @IsString()
  descricaoMaterial?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  volumeOuPesoEntrada?: number;

  @IsOptional()
  @IsString()
  unidadeEntrada?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
