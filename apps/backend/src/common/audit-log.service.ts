import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  userName?: string; // Novo campo para o nome do usuário
  entityType: string;
  entityId: string;
  entityName?: string; // Novo campo para o nome da entidade
  description: string;
}

@Injectable()
export class AuditLogService implements OnModuleInit {
  private logFilePath: string;

  constructor(private prisma: PrismaService) {
    this.logFilePath = path.join(
      process.cwd(),
      'apps',
      'backend',
      'logs',
      'audit.log.json',
    );
  }

  onModuleInit() {
    // Garante que o diretório de logs exista
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    // Garante que o arquivo de log exista e seja um JSON válido
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, '[]');
    }
  }

  async logDeletion(
    userId: string | undefined,
    entityType: string,
    entityId: string,
    entityName: string, // Agora recebemos o nome da entidade
    description: string,
  ): Promise<void> {
    let userName: string | undefined;
     if (userId) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      userName = user?.name || user?.email || userId; // Tenta pegar o nome, email ou o ID
    }

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      userName,
      entityType,
      entityId,
      entityName,
      description,
    };

    try {
      const fileContent = await fs.promises.readFile(this.logFilePath, 'utf8');
      const logs: AuditLogEntry[] = JSON.parse(fileContent);
      logs.push(entry);
      await fs.promises.writeFile(
        this.logFilePath,
        JSON.stringify(logs, null, 2),
      );
    } catch (error) {
    }
  }
}