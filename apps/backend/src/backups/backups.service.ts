import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execPromise = promisify(exec);

@Injectable()
export class BackupsService {
  constructor(private configService: ConfigService) {}

  async createDatabaseBackup(organizationId: string): Promise<{ filePath: string }> {
    // Extrai os detalhes do banco de dados da DATABASE_URL
    const dbUrlString = this.configService.get<string>('DATABASE_URL');
    if (!dbUrlString) {
      throw new InternalServerErrorException('DATABASE_URL não está definida.');
    }
    const dbUrl = new URL(dbUrlString);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port;
    const dbName = dbUrl.pathname.slice(1);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-org-${organizationId}-${timestamp}.dump`;

    // Define um diretório de backups na raiz do projeto backend
    const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFilePath = path.join(backupDir, backupFileName);

    // Monta o comando do pg_dump
    const command = `pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -F c -b -v -f "${backupFilePath}" ${dbName}`;

    try {
      // Define a senha via variável de ambiente para segurança
      const { stdout, stderr } = await execPromise(command, {
        env: { ...process.env, PGPASSWORD: dbPassword },
      });

      if (stderr) {
        console.error(`pg_dump stderr: ${stderr}`);
      }
      console.log(`pg_dump stdout: ${stdout}`);

      return { filePath: backupFilePath };

    } catch (error) {
      console.error('Erro ao executar pg_dump:', error);
      throw new InternalServerErrorException('Falha ao criar o backup do banco de dados.');
    }
  }
}