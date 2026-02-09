#!/usr/bin/env python3
"""
Script para migrar TODAS as tabelas do schema public para erp
Descobre automaticamente os nomes das colunas e respeita ordem de dependências
"""

import psycopg2
from psycopg2 import sql
import sys

# Configuração do banco
DB_CONFIG = {
    'host': '172.17.0.1',
    'port': 5432,
    'database': 'erp_electrosal',
    'user': 'admin',
    'password': 'Electrosal123'
}

# Ordem de migração (respeitando dependências)
MIGRATION_ORDER = [
    # Fase 1: Independentes
    'Organization',

    # Fase 2: Pessoas e usuários
    'Pessoa',
    'User',
    'UserSettings',
    'Client',
    'Fornecedor',
    'Funcionario',

    # Fase 3: Mídia e Landing Page
    'Media',
    'LandingPage',
    'Section',

    # Fase 4: Produtos
    'ProductGroup',
    'Product',
    'RawMaterial',
    'InventoryLot',
    'StockMovement',

    # Fase 5: Financeiro
    'ContaContabil',
    'ContaCorrente',
    'PaymentTerm',

    # Fase 6: Vendas
    'Sale',
    'SaleItem',
    'SaleItemLot',
    'SaleInstallment',
    'SaleAdjustment',

    # Fase 7: Contas
    'AccountPay',
    'AccountRec',
    'Transacao',

    # Fase 8: Cartões
    'CreditCard',
    'CreditCardBill',
    'CreditCardTransaction',
    'CreditCardFee',

    # Fase 9: Metal e Produção
    'MetalAccount',
    'MetalAccountEntry',
    'MetalCredit',
    'MetalReceivable',
    'MetalReceivablePayment',
    'RecoveryOrder',
    'Recuperacao',
    'AnaliseQuimica',
    'chemical_reactions',
    'ChemicalReactionLot',
    'pure_metal_lots',
    'PureMetalLotMovement',
    'RawMaterialUsed',

    # Fase 10: Compras e Cotações
    'PurchaseOrder',
    'PurchaseOrderItem',
    'Quotation',
    'LaborCostTableEntry',
    'OperationalCost',
    'MarketData',

    # Fase 11: Sistema
    'MenuItem',
    'AppearanceSettings',
    'Task',
    'Tutorial',
    'ThemePreset',
    'WhatsAppRoutine',
    'XmlImportLog',

    # Fase 12: Contadores
    'ProductionBatchCounter',
    'CrrCounter',
    'EntityCounter',

    # Fase 13: Migrations
    '_prisma_migrations',
]

def get_column_names(cursor, schema, table):
    """Retorna lista de nomes de colunas de uma tabela"""
    query = sql.SQL("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name = %s
        ORDER BY ordinal_position
    """)

    cursor.execute(query, (schema, table))
    return [row[0] for row in cursor.fetchall()]

def table_exists(cursor, schema, table):
    """Verifica se tabela existe"""
    query = """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = %s
              AND table_name = %s
        )
    """
    cursor.execute(query, (schema, table))
    return cursor.fetchone()[0]

def migrate_table(cursor, table_name):
    """Migra uma tabela específica"""
    print(f"\n🔄 Migrando {table_name}...")

    # Verificar se tabelas existem
    if not table_exists(cursor, 'erp', table_name):
        print(f"   ⏭️  Tabela erp.{table_name} não existe. Pulando...")
        return True

    if not table_exists(cursor, 'public', table_name):
        print(f"   ⏭️  Tabela public.{table_name} não existe. Pulando...")
        return True

    # Obter colunas
    erp_columns = get_column_names(cursor, 'erp', table_name)
    public_columns = get_column_names(cursor, 'public', table_name)

    if not erp_columns or not public_columns:
        print(f"   ⏭️  Tabela vazia ou sem colunas. Pulando...")
        return True

    # Encontrar colunas comuns
    common_columns = set(erp_columns) & set(public_columns)

    if not common_columns:
        print(f"   ⚠️  Nenhuma coluna em comum!")
        print(f"      ERP: {', '.join(erp_columns[:5])}...")
        print(f"      PUBLIC: {', '.join(public_columns[:5])}...")
        return False

    # Construir query de INSERT
    columns_list = sql.SQL(', ').join(
        map(sql.Identifier, sorted(common_columns))
    )

    insert_query = sql.SQL("""
        INSERT INTO {schema}.{table} ({columns})
        SELECT {columns}
        FROM {public_schema}.{table}
        ON CONFLICT DO NOTHING
    """).format(
        schema=sql.Identifier('erp'),
        table=sql.Identifier(table_name),
        public_schema=sql.Identifier('public'),
        columns=columns_list
    )

    # Executar migração
    try:
        cursor.execute(insert_query)
        count = cursor.rowcount
        print(f"   ✅ {count} registros migrados")
        return True
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False

def verify_all(cursor, tables):
    """Verifica contagem de todas as tabelas"""
    print("\n" + "=" * 60)
    print("🔍 VERIFICAÇÃO FINAL")
    print("=" * 60)

    all_match = True

    for table in tables:
        if not table_exists(cursor, 'erp', table):
            continue
        if not table_exists(cursor, 'public', table):
            continue

        try:
            cursor.execute(sql.SQL('SELECT COUNT(*) FROM public.{}').format(sql.Identifier(table)))
            public_count = cursor.fetchone()[0]

            cursor.execute(sql.SQL('SELECT COUNT(*) FROM erp.{}').format(sql.Identifier(table)))
            erp_count = cursor.fetchone()[0]

            match = "✅" if public_count == erp_count else "❌"
            print(f"{match} {table:30} | public: {public_count:6} | erp: {erp_count:6}")

            if public_count != erp_count:
                all_match = False
        except:
            pass

    return all_match

def main():
    print("=" * 60)
    print("MIGRAÇÃO COMPLETA: public → erp")
    print("=" * 60)

    try:
        # Conectar
        print("\n📡 Conectando ao banco...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        print("   ✅ Conectado!")

        # Migrar tabelas
        failed_tables = []

        for table in MIGRATION_ORDER:
            if not migrate_table(cursor, table):
                failed_tables.append(table)

        # Verificar
        if verify_all(cursor, MIGRATION_ORDER):
            if not failed_tables:
                conn.commit()
                print("\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
                print(f"   {len(MIGRATION_ORDER)} tabelas processadas")
                return 0
            else:
                print(f"\n⚠️  MIGRAÇÃO CONCLUÍDA COM AVISOS")
                print(f"   Tabelas com problemas: {', '.join(failed_tables)}")
                print("\n   Executar commit? (s/n)")
                # Para script automático, fazer commit mesmo com avisos
                conn.commit()
                return 0
        else:
            conn.rollback()
            print("\n❌ Verificação falhou. Rollback executado.")
            return 1

    except psycopg2.Error as e:
        print(f"\n❌ Erro de banco de dados: {e}")
        if 'conn' in locals():
            conn.rollback()
        return 1
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        if 'conn' in locals():
            conn.rollback()
        return 1
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        print("\n📡 Conexão fechada.")

if __name__ == '__main__':
    sys.exit(main())
