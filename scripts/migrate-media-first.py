#!/usr/bin/env python3
"""
Script para migrar Media do schema public para erp
Descobre automaticamente os nomes das colunas
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

def migrate_media(cursor):
    """Migra tabela Media"""
    print("\n🔄 Migrando Media...")

    # Obter colunas do schema erp
    erp_columns = get_column_names(cursor, 'erp', 'Media')
    public_columns = get_column_names(cursor, 'public', 'Media')

    if not erp_columns:
        print("❌ Tabela erp.Media não encontrada!")
        return False

    if not public_columns:
        print("❌ Tabela public.Media não encontrada!")
        return False

    print(f"   Colunas no erp.Media: {', '.join(erp_columns)}")
    print(f"   Colunas no public.Media: {', '.join(public_columns)}")

    # Encontrar colunas comuns
    common_columns = set(erp_columns) & set(public_columns)

    if not common_columns:
        print("❌ Nenhuma coluna em comum encontrada!")
        return False

    print(f"   Colunas comuns: {', '.join(sorted(common_columns))}")

    # Construir query de INSERT
    columns_list = sql.SQL(', ').join(map(sql.Identifier, sorted(common_columns)))

    insert_query = sql.SQL("""
        INSERT INTO erp."Media" ({columns})
        SELECT {columns}
        FROM public."Media"
        ON CONFLICT (id) DO NOTHING
    """).format(columns=columns_list)

    # Executar migração
    try:
        cursor.execute(insert_query)
        count = cursor.rowcount
        print(f"   ✅ {count} registros migrados")
        return True
    except Exception as e:
        print(f"   ❌ Erro ao migrar: {e}")
        return False

def verify_migration(cursor):
    """Verifica se a migração funcionou"""
    print("\n🔍 Verificando migração...")

    cursor.execute('SELECT COUNT(*) FROM public."Media"')
    public_count = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM erp."Media"')
    erp_count = cursor.fetchone()[0]

    print(f"   public.Media: {public_count} registros")
    print(f"   erp.Media: {erp_count} registros")

    if public_count == erp_count:
        print("   ✅ Migração bem-sucedida!")
        return True
    else:
        print(f"   ⚠️  Diferença de {public_count - erp_count} registros")
        return False

def main():
    print("=" * 60)
    print("MIGRAÇÃO DE MEDIA: public → erp")
    print("=" * 60)

    try:
        # Conectar ao banco
        print("\n📡 Conectando ao banco...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        print("   ✅ Conectado!")

        # Migrar Media
        if migrate_media(cursor):
            # Verificar
            if verify_migration(cursor):
                # Commit
                conn.commit()
                print("\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
                return 0
            else:
                conn.rollback()
                print("\n❌ Verificação falhou. Rollback executado.")
                return 1
        else:
            conn.rollback()
            print("\n❌ Migração falhou. Rollback executado.")
            return 1

    except psycopg2.Error as e:
        print(f"\n❌ Erro de banco de dados: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        return 1
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        print("\n📡 Conexão fechada.")

if __name__ == '__main__':
    sys.exit(main())
