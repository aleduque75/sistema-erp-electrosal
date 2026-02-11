import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class KnowledgeBaseService {
  private readonly DOCS_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'docs');

  async getMarkdownFiles(): Promise<string[]> {
    const markdownFiles: string[] = [];

    const readDirectoryRecursive = async (currentPath: string, relativePath: string = '') => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const newRelativePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await readDirectoryRecursive(fullPath, newRelativePath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          markdownFiles.push(newRelativePath);
        }
      }
    };

    try {
      await readDirectoryRecursive(this.DOCS_PATH);
      return markdownFiles.sort();
    } catch (error) {
      console.error('Error reading docs directory recursively:', error);
      return [];
    }
  }

  async getMarkdownFileContent(filename: string): Promise<string> {
    const filePath = path.join(this.DOCS_PATH, filename);

    // Security check: Ensure the resolved path is within the DOCS_PATH
    if (!filePath.startsWith(this.DOCS_PATH)) {
      throw new BadRequestException('Invalid file path.');
    }
    console.log('Resolved filePath (GET):', filePath);

    try {
      await fs.access(filePath, fs.constants.R_OK); // Check if file exists and is readable
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File ${filename} not found.`);
      }
      console.error(`Error reading file ${filename}:`, error);
      throw error;
    }
  }

  async updateMarkdownFileContent(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.DOCS_PATH, filename);

    // Security check: Ensure the resolved path is within the DOCS_PATH
    if (!filePath.startsWith(this.DOCS_PATH)) {
      throw new BadRequestException('Invalid file path.');
    }
    console.log('Resolved filePath (PUT):', filePath);

    try {
      // Ensure parent directories exist
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File ${filename} not found.`);
      }
      console.error(`Error writing file ${filename}:`, error);
      throw error;
    }
  }

  async deleteMarkdownFile(filename: string): Promise<void> {
    const filePath = path.join(this.DOCS_PATH, filename);

    // Security check: Ensure the resolved path is within the DOCS_PATH
    if (!filePath.startsWith(this.DOCS_PATH)) {
      throw new BadRequestException('Invalid file path.');
    }
    console.log('Resolved filePath (DELETE):', filePath);

    try {
      await fs.access(filePath, fs.constants.F_OK); // Check if file exists
      await fs.unlink(filePath); // Delete the file
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File ${filename} not found.`);
      }
      console.error(`Error deleting file ${filename}:`, error);
      throw error;
    }
  }
}
