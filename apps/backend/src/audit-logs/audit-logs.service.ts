import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditLogsService {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'apps', 'backend', 'logs', 'audit.log.json');
  }

  async findAll() {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }
      const fileContent = await fs.promises.readFile(this.logFilePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Failed to read audit log file: ${error.message}`);
      return [];
    }
  }
}
