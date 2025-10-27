


##

#Podemos ver material prima, ela é utilizada na recuperação, e tambem na reação, poderia ter entrada por pedido de compra, gerar contas a pagar, poder ou não seer revenda

na recuperação, ter uma opção de colocar a quantidade em uma recuperação, finalizada ou não, exemplo uma recuparação que ja terminou , mas me dar a opção de inserir materia prime, ele computar exemplo utilizai 1 kg de po de zinco que custou R$ 80,00 pegar a cotação do dia da recuperação e dividir, 80 / 720 exemplo = 0,11 gr, ai tambem utilizou acido nitrico 4 lt, R$ 120,00 / 720 = 0,16 gr, em um relatorio de recuperação teria os valores retirados teria que ser algo assim

analise 1 = recuperar 20 gr, paguei 16 gr para cliente
analise 2 = recuperar 80 gr, paguei 65 gr para cliente

recuperação 100 gr da analise 1 e 2
gastou material po de zinco = 0,15
gastou material acido nitrico = 0,11


tirou 85 gr, ficou 15 como resuduo para recuperar

em um periodo ira ter algumas recuperações que terão valores pagos para clientes e matrerias gastos

ficaria algo como 

Recuperado 350 gr
Pago cliente 300 gr
mateiral gasto 15 gr
a recuperar 20 gr 

Lucro 50 gr - 15 gr = 35 gr, mas tem 20 a recuperar em residuo

algo assim, deu para entender

  Proponho um plano em três fases:
  Fase 1: Backend - Gestão Central de Matéria-Prima
   1. Definir modelo RawMaterial (nome, descrição, unidade, custo, organização, revenda).
   2. Criar módulo CRUD para RawMaterial.
   3. Integrar com PurchaseOrder para gerar AccountsPayable.

  Fase 2: Backend - Integração com Recuperação e Reação
   1. Atualizar RecoveryOrder e ChemicalReaction para rastrear RawMaterialUsed.
   2. Definir modelo RawMaterialUsed (quantidade, custo, custo equivalente em ouro).
   3. Modificar casos de uso de RecoveryOrder e ChemicalReaction para incluir seleção e cálculo de custos de 
      matéria-prima.
   4. Ajustar cálculos financeiros para incluir custos de matéria-prima.

  Fase 3: Frontend - UI para Matéria-Prima
   1. Criar UI para CRUD de RawMaterial.
   2. Integrar seleção e entrada de matéria-prima nos formulários de RecoveryOrder e ChemicalReaction.
   3. Atualizar relatórios para exibir custos de matéria-prima e cálculos de lucro.

  Aguardarei a aprovação do usuário para este plano.