import { Test, TestingModule } from '@nestjs/testing';
import { BankStatementImportsService } from './bank-statement-imports.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// Mock simples para ofx-js
jest.mock('ofx-js', () => ({
  parse: jest.fn(),
}));

import * as ofx from 'ofx-js';

describe('BankStatementImportsService', () => {
  let service: BankStatementImportsService;
  let prisma: {
    contaCorrente: { findFirst: jest.Mock };
    transacao: { findMany: jest.Mock };
    quotation: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      contaCorrente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cc-1', organizationId: 'org-1' }),
      },
      transacao: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      quotation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankStatementImportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BankStatementImportsService>(BankStatementImportsService);
  });

  it('should detect duplicate transaction with 1 day difference (e.g. OFX on 11/01 and system on 12/01)', async () => {
    // Transação já existente no sistema no dia 12/01/2023 no valor de 320.00
    prisma.transacao.findMany.mockResolvedValue([
      {
        id: 'tx-existing-1',
        dataHora: new Date('2023-01-12T10:00:00.000Z'),
        valor: new Decimal(320.0),
        tipo: 'DEBITO',
        descricao: 'PAGAMENTO FORNECEDOR',
        fitId: null,
      },
    ]);

    // OFX traz a transação no dia 11/01/2023 no valor de -320.00
    (ofx.parse as jest.Mock).mockResolvedValue({
      OFX: {
        BANKMSGSRSV1: {
          STMTTRNRS: {
            STMTRS: {
              BANKTRANLIST: {
                STMTTRN: [
                  {
                    TRNTYPE: 'DEBIT',
                    DTPOSTED: '20230111120000',
                    TRNAMT: '-320.00',
                    FITID: 'ofx-fit-320',
                    MEMO: 'PAGTO FORN 320',
                  },
                ],
              },
            },
          },
        },
      },
    });

    const result = await service.previewOfx('org-1', Buffer.from('dummy'), 'cc-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('duplicate');
    expect(result[0].matchedDate).toBe('2023-01-12');
  });

  it('should detect duplicate transaction with up to 3 days difference (e.g. Friday to Monday)', async () => {
    // Transação no sistema no dia 15/01/2023
    prisma.transacao.findMany.mockResolvedValue([
      {
        id: 'tx-existing-2',
        dataHora: new Date('2023-01-15T10:00:00.000Z'),
        valor: new Decimal(500.0),
        tipo: 'CREDITO',
        descricao: 'RECEBIMENTO PIX',
        fitId: null,
      },
    ]);

    // OFX traz no dia 12/01/2023 (3 dias de diferença)
    (ofx.parse as jest.Mock).mockResolvedValue({
      OFX: {
        BANKMSGSRSV1: {
          STMTTRNRS: {
            STMTRS: {
              BANKTRANLIST: {
                STMTTRN: [
                  {
                    TRNTYPE: 'CREDIT',
                    DTPOSTED: '20230112120000',
                    TRNAMT: '500.00',
                    FITID: 'ofx-fit-500',
                    MEMO: 'PIX CLIENTE',
                  },
                ],
              },
            },
          },
        },
      },
    });

    const result = await service.previewOfx('org-1', Buffer.from('dummy'), 'cc-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('duplicate');
    expect(result[0].matchedDate).toBe('2023-01-15');
  });

  it('should mark as new if date difference is greater than 3 days', async () => {
    // Transação no sistema com mais de 3 dias de diferença (ex: 20/01)
    prisma.transacao.findMany.mockResolvedValue([
      {
        id: 'tx-existing-3',
        dataHora: new Date('2023-01-20T10:00:00.000Z'),
        valor: new Decimal(320.0),
        tipo: 'DEBITO',
        descricao: 'OUTRO PAGAMENTO',
        fitId: null,
      },
    ]);

    // OFX traz dia 11/01 (9 dias de diferença)
    (ofx.parse as jest.Mock).mockResolvedValue({
      OFX: {
        BANKMSGSRSV1: {
          STMTTRNRS: {
            STMTRS: {
              BANKTRANLIST: {
                STMTTRN: [
                  {
                    TRNTYPE: 'DEBIT',
                    DTPOSTED: '20230111120000',
                    TRNAMT: '-320.00',
                    FITID: 'ofx-fit-320',
                    MEMO: 'PAGTO 320',
                  },
                ],
              },
            },
          },
        },
      },
    });

    const result = await service.previewOfx('org-1', Buffer.from('dummy'), 'cc-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('new');
    expect(result[0].matchedDate).toBeNull();
  });

  it('should handle single STMTTRN object (not array) and sanitize ampersand', async () => {
    (ofx.parse as jest.Mock).mockImplementation(async (content: string) => {
      // Confirma que o & foi sanitizado para &amp;
      expect(content).toContain('R &amp; K COMERCIO');
      return {
        OFX: {
          BANKMSGSRSV1: {
            STMTTRNRS: {
              STMTRS: {
                BANKTRANLIST: {
                  STMTTRN: {
                    TRNTYPE: 'PAYMENT',
                    DTPOSTED: '20240522',
                    TRNAMT: '-49.80',
                    FITID: '202405220771',
                    MEMO: 'R & K COMERCIO',
                  },
                },
              },
            },
          },
        },
      };
    });

    const fileBuffer = Buffer.from('<MEMO>R & K COMERCIO</MEMO>', 'utf-8');
    const result = await service.previewOfx('org-1', fileBuffer, 'cc-1');

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('R & K COMERCIO');
    expect(result[0].amount).toBe(49.8);
    expect(result[0].type).toBe('DEBIT');
  });
});
