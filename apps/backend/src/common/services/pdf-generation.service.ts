import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGenerationService {
  async generatePdf(templateName: string, data: any): Promise<Buffer> {
    const templatePath = path.resolve(__dirname, '..', '..', 'templates', `${templateName}.hbs`);
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);
    const html = template(data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    return pdf;
  }
}
