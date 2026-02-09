-- =====================================================
-- VERIFICAR ESTRUTURA DO SCHEMA ERP
-- Execute este script para descobrir os nomes reais das colunas
-- =====================================================

-- Media
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'Media'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- LandingPage
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'LandingPage'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- Section
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'Section'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- Product
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'Product'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- Sale
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'Sale'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- Organization
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'Organization'
ORDER BY ordinal_position;

\echo '\n========================================\n'

-- User
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'erp'
  AND table_name = 'User'
ORDER BY ordinal_position;
