import { Controller, Get, Param, Put, Body, Delete } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get()
  async getMarkdownFiles(): Promise<string[]> {
    return this.knowledgeBaseService.getMarkdownFiles();
  }

  @Get('*path')
  async getMarkdownFileContent(@Param('path') path: string): Promise<string> {
    return this.knowledgeBaseService.getMarkdownFileContent(path);
  }

  @Put('*path')
  async updateMarkdownFileContent(
    @Param('path') path: string,
    @Body('content') content: string,
  ): Promise<void> {
    await this.knowledgeBaseService.updateMarkdownFileContent(path, content);
  }

  @Delete('*path')
  async deleteMarkdownFile(@Param('path') path: string): Promise<void> {
    await this.knowledgeBaseService.deleteMarkdownFile(path);
  }
}
