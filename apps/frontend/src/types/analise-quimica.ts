// apps/frontend/src/types/analise-quimica.ts (CORRIGIDO)

// Mantemos o import type, mas precisaremos do tipo de valor do Enum para a interface
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';
import { TipoMetal } from './tipo-metal';

// Definindo a interface simplificada do cliente localmente
export interface ClienteAnalise {
  name: string;
}

// Criando o tipo de valor literal do Enum (A CORREÇÃO PRINCIPAL)
type StatusAnaliseQuimicaLiteral = (typeof StatusAnaliseQuimica)[keyof typeof StatusAnaliseQuimica];

export interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  dataEntrada: string;
  descricaoMaterial: string;
  metalType?: TipoMetal;
  
  // Usando o novo tipo literal
  status: StatusAnaliseQuimicaLiteral;
  
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  resultadoAnaliseValor?: number;
  unidadeResultado?: string;
  percentualQuebra?: number;
  taxaServicoPercentual?: number;
  teorRecuperavel?: number;
  auEstimadoBrutoGramas?: number;
  auEstimadoRecuperavelGramas?: number;
  taxaServicoEmGramas?: number;
  auLiquidoParaClienteGramas?: number;
  observacoes?: string;
  
  cliente?: ClienteAnalise; 
  
  resultado?: any;
  pdfUrl?: string;
}