export interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  dataEntrada: string;
  descricaoMaterial: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDA' | 'APROVADA';
  cliente?: {
    nome: string;
  };
  // Adicione outros campos que possam ser úteis
  resultado?: any; // Pode ser um objeto mais complexo
  pdfUrl?: string;
}
