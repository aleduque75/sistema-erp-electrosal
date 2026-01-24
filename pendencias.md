Exatamente como eu suspeitava, Alexandre. O seu arquivo .dump é, na verdade, um arquivo de texto puro com comandos SQL (gerado pelo pg_dump padrão), e não um arquivo binário compactado. Por isso o pg_restore reclamou.

Para restaurar esse tipo de arquivo, usamos o psql diretamente.
🛠️ Comando de Restauração (Versão SQL)

Rode este comando no seu terminal do Linux Mint:

cat apps/backend/backups/backup_2026-01-23T17-30-41-701Z.dump | docker exec -i sistema-electrosal-db psql -U aleduque -d sistema_electrosal_dev

🔍 O que esse comando faz:

    cat: Lê o conteúdo do seu arquivo SQL.

    docker exec -i: Abre o canal de entrada do container do banco ERP.

    psql: Executa cada linha do arquivo (CREATE TABLE, INSERT, etc.) dentro do seu banco de dados.

    ⚠️ O que você pode ver no terminal:

Como o banco de dados foi recriado recentemente, talvez você veja algumas mensagens de erro como:

    ERROR: relation "exemplo" already exists (Se o Prisma já tiver criado a tabela).

    NOTICE: table "exemplo" does not exist, skipping (Se o backup tentar deletar algo antes de criar).

Não se assuste: Se a maioria das mensagens for INSERT 0 1, CREATE TABLE ou ALTER TABLE, a restauração está funcionando perfeitamente.


✅ Como confirmar se deu certo?

Após o comando terminar, você pode verificar se os dados voltaram com um comando rápido:
Bash

docker exec -it sistema-electrosal-db psql -U aleduque -d sistema_electrosal_dev -c "\dt"

(Isso vai listar todas as tabelas que foram restauradas no seu banco).

O comando rodou até o fim ou parou em algum erro de "Permission Denied"?

Assim que os dados estiverem lá, você quer que eu te ajude a rodar o npx prisma generate para garantir que o seu NestJS reconheça tudo o que foi restaurado?