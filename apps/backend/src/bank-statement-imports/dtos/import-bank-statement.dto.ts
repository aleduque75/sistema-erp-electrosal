import { IsNotEmpty, IsUUID } from 'class-validator';

// Renomeado para refletir a ação de pré-visualização
export class PreviewBankStatementDto {
  @IsUUID()
  @IsNotEmpty({ message: 'A conta corrente de destino é obrigatória.' })
  contaCorrenteId: string;
}
