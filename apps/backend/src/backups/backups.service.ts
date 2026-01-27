import { Injectable, Logger, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { exec, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir: string;
  private readonly dbService: string;
  private readonly dbUser: string;
  private readonly dbName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.backupDir = path.join(process.cwd(), 'backups'); // Store backups in a 'backups' folder at the project root
    this.dbService = this.configService.get<string>('DB_SERVICE_NAME', 'db'); // e.g., 'db' from docker-compose
    this.dbUser = this.configService.get<string>('DATABASE_USER', 'aleduque');
    this.dbName = this.configService.get<string>('DATABASE_NAME', 'sistema_electrosal_dev');

    // Ensure backup directory exists
    fs.mkdir(this.backupDir, { recursive: true }).catch(err => {
      this.logger.error(`Failed to create backup directory: ${this.backupDir}`, err.stack);
    });
  }

  async createBackup(): Promise<{ filename: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.dump`;
    const backupPath = path.join(this.backupDir, filename);

    const command = `docker compose exec -T ${this.dbService} pg_dump -U ${this.dbUser} -d ${this.dbName} > ${backupPath}`;

    this.logger.log(`Creating backup: ${filename}`);
    try {
      // Use execSync for simplicity, but for very large backups, exec might be better
      execSync(command);
      this.logger.log(`Backup created successfully: ${filename}`);
      return { filename };
    } catch (error) {
      this.logger.error(`Failed to create backup: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao criar backup do banco de dados.');
    }
  }

  async listBackups(): Promise<{ filename: string; createdAt: Date; size: number }[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.dump'));

      const detailedBackups = await Promise.all(backupFiles.map(async file => {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        return {
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      }));

      return detailedBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao listar backups.');
    }
  }

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const backupPath = path.join(this.backupDir, filename);

    if (!await fs.access(backupPath).then(() => true).catch(() => false)) {
      throw new NotFoundException(`Arquivo de backup '${filename}' não encontrado.`);
    }

    const terminateConnectionsCommand = `docker compose exec -T ${this.dbService} psql -U ${this.dbUser} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.dbName}' AND pid <> pg_backend_pid();"`;
    const dropDbCommand = `docker compose exec -T ${this.dbService} dropdb -U ${this.dbUser} ${this.dbName}`;
    const createDbCommand = `docker compose exec -T ${this.dbService} createdb -U ${this.dbUser} ${this.dbName}`;
    // Get container ID dynamically
    const containerId = execSync(`docker compose ps -q ${this.dbService}`).toString().trim();
    if (!containerId) {
      throw new InternalServerErrorException(`Could not find container ID for service ${this.dbService}. Is the database service running?`);
    }

    // Copy backup file into the container
    const containerBackupPath = `/tmp/${filename}`; // Temporary path inside the container
    const copyCommand = `docker cp ${backupPath} ${containerId}:${containerBackupPath}`;
    execSync(copyCommand);

    // Restore from within the container
    const restoreCommand = `docker compose exec -T ${this.dbService} bash -c "set -e && psql -v ON_ERROR_STOP=1 -U ${this.dbUser} -d ${this.dbName} -f ${containerBackupPath} 2>&1"`;

    this.logger.log(`Restoring backup: ${filename}`);
    try {
      this.logger.log('Terminating active database connections...');
      execSync(terminateConnectionsCommand);
      this.logger.log('Active connections terminated. Dropping database...');
      execSync(dropDbCommand);
      this.logger.log('Database dropped. Creating new database...');
      execSync(createDbCommand);
      this.logger.log('New database created. Restoring data...');
      execSync(restoreCommand);
      this.logger.log(`Backup '${filename}' restaurado com sucesso.`);
      return { message: `Backup '${filename}' restaurado com sucesso.` };
    } catch (error) {
      this.logger.error(`Failed to restore backup: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao restaurar backup do banco de dados.');
    }
  }
}