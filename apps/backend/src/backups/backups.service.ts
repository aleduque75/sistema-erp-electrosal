import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir: string;
  private readonly containerName: string;
  private readonly dbUser: string;
  private readonly dbName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Define o diretório de backups na raiz do projeto
    this.backupDir = path.join(process.cwd(), 'backups');
    
    // Configurações extraídas do seu ambiente atual
    this.containerName = 'erp_postgres'; 
    this.dbUser = this.configService.get<string>('DATABASE_USER', 'admin');
    this.dbName = this.configService.get<string>('DATABASE_NAME', 'erp_electrosal');

    // Garante que a pasta de backup existe
    fs.mkdir(this.backupDir, { recursive: true }).catch(err => {
      this.logger.error(`Erro ao criar pasta de backup: ${this.backupDir}`, err.stack);
    });
  }

  async createBackup(): Promise<{ filename: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`; // Mudado para .sql para facilitar leitura
    const backupPath = path.join(this.backupDir, filename);

    // Comando direto via Docker Exec (Mais robusto para VPS)
    const command = `docker exec ${this.containerName} pg_dump -U ${this.dbUser} -d ${this.dbName} > ${backupPath}`;

    this.logger.log(`Iniciando backup: ${filename}`);
    try {
      execSync(command);
      
      // Validação: Checa se o arquivo não está vazio
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        throw new Error('O arquivo de backup foi gerado com 0 bytes.');
      }

      this.logger.log(`Backup concluído com sucesso: ${filename} (${stats.size} bytes)`);
      return { filename };
    } catch (error) {
      this.logger.error(`Falha ao criar backup: ${error.message}`);
      throw new InternalServerErrorException('Falha ao gerar arquivo de backup.');
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      // Filtra arquivos .sql ou .dump
      const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.dump'));

      const detailedBackups = await Promise.all(backupFiles.map(async file => {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        return {
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      }));

      return detailedBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new InternalServerErrorException('Erro ao listar arquivos de backup.');
    }
  }

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const backupPath = path.join(this.backupDir, filename);

    if (!await fs.access(backupPath).then(() => true).catch(() => false)) {
      throw new NotFoundException(`Arquivo ${filename} não encontrado.`);
    }

    // Comandos de restauração adaptados para Docker direto
    const terminateConnections = `docker exec ${this.containerName} psql -U ${this.dbUser} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.dbName}' AND pid <> pg_backend_pid();"`;
    const dropDb = `docker exec ${this.containerName} dropdb -U ${this.dbUser} ${this.dbName}`;
    const createDb = `docker exec ${this.containerName} createdb -U ${this.dbUser} ${this.dbName}`;
    
    // Caminho temporário dentro do container para a restauração
    const containerTmpPath = `/tmp/${filename}`;
    const copyToContainer = `docker cp ${backupPath} ${this.containerName}:${containerTmpPath}`;
    const restoreCmd = `docker exec ${this.containerName} psql -U ${this.dbUser} -d ${this.dbName} -f ${containerTmpPath}`;

    try {
      this.logger.log(`Restaurando backup: ${filename}`);
      
      execSync(terminateConnections);
      execSync(dropDb);
      execSync(createDb);
      execSync(copyToContainer);
      execSync(restoreCmd);

      this.logger.log(`Backup ${filename} restaurado com sucesso.`);
      return { message: `Backup '${filename}' restaurado.` };
    } catch (error) {
      this.logger.error(`Erro na restauração: ${error.message}`);
      throw new InternalServerErrorException('Erro crítico ao restaurar o banco de dados.');
    }
  }
}
