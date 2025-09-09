import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  IPessoaRepository,
  AnaliseQuimica,
  Pessoa,
} from '@sistema-erp-electrosal/core';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';

export interface GerarPdfAnaliseCommand {
  analiseId: string;
}

@Injectable()
export class GerarPdfAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IPessoaRepository')
    private readonly pessoaRepository: IPessoaRepository,
  ) {
    if (!Handlebars.helpers.formatarNumero) {
      Handlebars.registerHelper(
        'formatarNumero',
        (valor, casasDecimais = 2) => {
          if (valor === null || valor === undefined || isNaN(Number(valor)))
            return 'N/A';
          return Number(valor).toFixed(casasDecimais).replace('.', ',');
        },
      );
      Handlebars.registerHelper('formatarData', (data) => {
        if (!data) return 'N/A';
        try {
          return format(new Date(data), 'dd/MM/yyyy');
        } catch (e) {
          return '';
        }
      });
      Handlebars.registerHelper('formatarPercentual', (valor) => {
        if (typeof valor !== 'number' || isNaN(valor)) return 'N/A';
        return `${(valor * 100).toFixed(2)}%`.replace('.', ',');
      });
    }
  }

  private async getImageAsBase64(filePath: string): Promise<string | null> {
    try {
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      return base64Image;
    } catch (error) {
      return null;
    }
  }

  async execute(command: GerarPdfAnaliseCommand): Promise<Buffer> {
    // ...restante do método conforme necessário...
    throw new Error('Método não implementado.');
  }
}
