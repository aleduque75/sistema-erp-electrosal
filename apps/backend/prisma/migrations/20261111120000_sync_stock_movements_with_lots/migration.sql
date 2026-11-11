-- Inserir movimentação retroativa de ajuste para sincronizar lotes com o extrato para Ag CN 54% (Lote 1209)
INSERT INTO "erp"."StockMovement" ("id", "productId", "type", "quantity", "createdAt", "organizationId", "inventoryLotId", "sourceDocument")
SELECT 
  gen_random_uuid()::TEXT,
  il."productId",
  'MANUAL_ADJUSTMENT',
  145.0,
  NOW(),
  il."organizationId",
  il."id",
  'Ajuste Manual Lote #1209'
FROM "erp"."inventory_lots" il
JOIN "erp"."Product" p ON p."id" = il."productId"
WHERE il."batchNumber" = '1209' 
  AND p."name" LIKE '%Ag CN 54%%'
  AND il."remainingQuantity" >= 300.0
  AND NOT EXISTS (
    SELECT 1 FROM "erp"."StockMovement" sm 
    WHERE sm."inventoryLotId" = il."id" 
      AND sm."quantity" = 145.0
  );
