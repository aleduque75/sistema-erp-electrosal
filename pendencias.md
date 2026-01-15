analise o pedido de id cecee95b-d081-48ad-b3b6-b3bc3e9bffe4

o prazo de pagamento coloquei 14/28 dias ele criou em sale_installments 2 parcelas, som que no a receber tem somente um lançamento , ficou estranho isso, e en sale_adjustmenst ele fica negativo, não sei se deveria nesse memento, deveria fica zerado, ate ir recebendo não seria

---
**Resolvido:** O problema de inconsistência entre `sale_installments` e `accounts_rec` para vendas 'A_PRAZO' foi corrigido em `confirm-sale.use-case.ts`. Para vendas 'A_PRAZO', quaisquer `AccountRec` existentes são agora incondicionalmente excluídos antes da criação de `AccountRec` individuais para cada parcela. As variáveis de cálculo (`finalNetAmount`, `finalGoldPrice`, `finalGoldValue`, `settings`) foram movidas para um escopo superior para resolver problemas de escopo.

**Como testar:** Crie uma nova venda 'A_PRAZO' com parcelas e verifique se um `AccountRec` separado é criado para cada parcela e se o `SaleAdjustment` é calculado corretamente. Devido à impossibilidade de resetar o banco de dados atual, não foi possível revalidar a venda original.
