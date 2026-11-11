-- Correção retroativa dos valores da venda #32069 e duplicata(s) de Contas a Receber (Ag CN 54%)
-- Venda de 400g a R$ 7,95 = R$ 3.180,00 que foi indevidamente multiplicada pela cotação do Ouro gerando R$ 145.800,00

-- 1. Corrigir a Venda #32069
UPDATE "erp"."Sale"
SET 
  "totalAmount" = 3180.00,
  "netAmount" = 3180.00,
  "goldValue" = ROUND(3180.00 / NULLIF("goldPrice", 0), 4)
WHERE "orderNumber" = 32069
  AND ("netAmount" > 10000 OR "totalAmount" > 10000);

-- 2. Corrigir AccountRec vinculada à venda #32069 se única e não recebida
UPDATE "erp"."accounts_rec" ar
SET 
  "amount" = 3180.00,
  "goldAmount" = ROUND(3180.00 / NULLIF(s."goldPrice", 0), 4)
FROM "erp"."Sale" s
WHERE ar."saleId" = s."id"
  AND s."orderNumber" = 32069
  AND ar."received" = FALSE
  AND (ar."amountPaid" IS NULL OR ar."amountPaid" = 0)
  AND ar."amount" > 10000
  AND (
    SELECT COUNT(*) FROM "erp"."accounts_rec" ar2 WHERE ar2."saleId" = s."id"
  ) = 1;

-- 3. Caso tenha sido desmembrada em 2 parcelas (ex: R$ 72.900 cada), corrigir para 2x de R$ 1.590,00
UPDATE "erp"."accounts_rec" ar
SET 
  "amount" = 1590.00,
  "goldAmount" = ROUND(1590.00 / NULLIF(s."goldPrice", 0), 4)
FROM "erp"."Sale" s
WHERE ar."saleId" = s."id"
  AND s."orderNumber" = 32069
  AND ar."received" = FALSE
  AND (ar."amountPaid" IS NULL OR ar."amountPaid" = 0)
  AND ar."amount" > 50000
  AND (
    SELECT COUNT(*) FROM "erp"."accounts_rec" ar2 WHERE ar2."saleId" = s."id"
  ) = 2;
