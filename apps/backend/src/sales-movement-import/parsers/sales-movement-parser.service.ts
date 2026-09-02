import { Injectable, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';

@Injectable()
export class SalesMovementParserService {
  parse(fileBuffer: Buffer): Record<string, any>[] {
    let csvData = fileBuffer.toString('utf-8');
    if (csvData.startsWith('\uFEFF')) {
      csvData = csvData.substring(1);
    }

    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: ';',
      transformHeader: (header) => {
        const trimmed = header.trim();
        if (trimmed === 'Nº DO LOTE') return 'N_DO_LOTE';
        if (trimmed === 'Nº DO PEDIDO') return 'N_DO_PEDIDO';
        if (trimmed === 'PEDIDOS EM SAL') return 'PEDIDOS_EM_SAL';
        if (trimmed === 'PEDIDOS EM FINO') return 'PEDIDOS_EM_FINO';
        if (trimmed.toLowerCase() === 'data') return 'data_row';
        return trimmed;
      },
    });

    if (parsed.errors.length) {
      throw new BadRequestException(
        'Erro ao ler o arquivo CSV. Verifique o formato.',
      );
    }

    return parsed.data as Record<string, any>[];
  }
}
