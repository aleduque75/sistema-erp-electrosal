import { SalesMovementParserService } from './sales-movement-parser.service';

describe('SalesMovementParserService', () => {
  let service: SalesMovementParserService;

  beforeEach(() => {
    service = new SalesMovementParserService();
  });

  it('should parse valid CSV with normalized headers', () => {
    const csvContent = `Nº DO LOTE;Nº DO PEDIDO;PEDIDOS EM SAL;PEDIDOS EM FINO;Data\n1094;123;50,5;40,2;01/01/2026`;
    const buffer = Buffer.from(csvContent, 'utf-8');

    const result = service.parse(buffer);

    expect(result).toHaveLength(1);
    expect(result[0]['N_DO_LOTE']).toBe(1094);
    expect(result[0]['N_DO_PEDIDO']).toBe(123);
    expect(result[0]['data_row']).toBe('01/01/2026');
  });

  it('should handle UTF-8 BOM properly', () => {
    const csvContent = `\uFEFFNº DO LOTE;Nº DO PEDIDO\n100;200`;
    const buffer = Buffer.from(csvContent, 'utf-8');

    const result = service.parse(buffer);
    expect(result[0]['N_DO_LOTE']).toBe(100);
  });
});
