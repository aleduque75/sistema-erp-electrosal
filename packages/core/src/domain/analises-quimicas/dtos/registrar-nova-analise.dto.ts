import { IsString, IsNotEmpty, IsDate, IsNumber, Min, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '../../enums/tipo-metal.enum';

export class RegistrarNovaAnaliseDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(TipoMetal)
  metalType!: TipoMetal;

  @IsDate()
  @Type(() => Date)
  dataEntrada!: Date;

  @IsString()
  @IsNotEmpty()
  descricaoMaterial!: string;

  @IsNumber()
  @Min(0.001)
  volumeOuPesoEntrada!: number;

  @IsString()
  @IsNotEmpty()
  unidadeEntrada!: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
