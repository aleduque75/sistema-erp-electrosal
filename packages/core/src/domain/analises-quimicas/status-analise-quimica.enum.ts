export enum StatusAnaliseQuimica {
  RECEBIDO = 'RECEBIDO', // Material recebido, aguardando início da análise
  EM_ANALISE = 'EM_ANALISE', // Análise em progresso
  ANALISADO_AGUARDANDO_APROVACAO = 'ANALISADO_AGUARDANDO_APROVACAO', // Análise concluída, aguardando aprovação do cliente para recuperar
  APROVADO_PARA_RECUPERACAO = 'APROVADO_PARA_RECUPERACAO', // Cliente aprovou, pronto para entrar numa Ordem de Recuperação
  RECUSADO_PELO_CLIENTE = 'RECUSADO_PELO_CLIENTE', // Cliente não aprovou a recuperação (material a ser devolvido ou descartado)
  EM_RECUPERACAO = 'EM_RECUPERACAO', // Já está associada a uma OrdemDeRecuperacao em andamento
  FINALIZADO_RECUPERADO = 'FINALIZADO_RECUPERADO', // O Au desta análise foi recuperado e o processo referente a ela concluído
  CANCELADO = 'CANCELADO', // Análise cancelada por algum motivo
}
