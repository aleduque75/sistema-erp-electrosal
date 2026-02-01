import { IsString, IsBoolean, IsOptional, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWhatsappRoutineDto {
  @ApiProperty({ description: 'Nome único da rotina' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Gatilho da rotina (comando)', example: '/minharotina' })
  @IsString()
  trigger: string;

  @ApiProperty({ description: 'Descrição da rotina', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status de ativação da rotina', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Passos da rotina em formato JSON', type: 'string' })
  @IsJSON()
  steps: string; // Deve ser uma string JSON válida
}
