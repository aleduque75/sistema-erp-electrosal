// apps/backend/src/sales/sales.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  Sale,
  Prisma,
  Client,
  Product,
  ContaContabil,
  ContaCorrente,
  Transacao,
  StockMovement,
  // O tipo 'TipoContaContabilPrisma' foi removido pois não era utilizado.
} from '@prisma/client';
import { CreateSaleDto } from './dtos/sales.dto';
import { CalculateSaleAdjustmentUseCase } from './use-cases/calculate-sale-adjustment.use-case';
import { Decimal } from 'decimal.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Definindo o tipo do Mock do PrismaService com os tipos de retorno e argumentos corretos para jest.fn()
type MockPrismaService = {
  sale: {
    create: jest.Mock<Promise<Sale>, [Prisma.SaleCreateArgs]>;
    findMany: jest.Mock<Promise<Sale[]>, [Prisma.SaleFindManyArgs]>;
    findUnique: jest.Mock<Promise<Sale | null>, [Prisma.SaleFindUniqueArgs]>;
    update: jest.Mock<Promise<Sale>, [Prisma.SaleUpdateArgs]>;
    delete: jest.Mock<Promise<Sale>, [Prisma.SaleDeleteArgs]>;
  };
  client: {
    findUnique: jest.Mock<
      Promise<Client | null>,
      [Prisma.ClientFindUniqueArgs]
    >;
  };
  product: {
    findMany: jest.Mock<Promise<Product[]>, [Prisma.ProductFindManyArgs]>;
    update: jest.Mock<Promise<Product>, [Prisma.ProductUpdateArgs]>;
  };
  contaContabil: {
    findUnique: jest.Mock<
      Promise<ContaContabil | null>,
      [Prisma.ContaContabilFindUniqueArgs]
    >;
  };
  contaCorrente: {
    findUnique: jest.Mock<
      Promise<ContaCorrente | null>,
      [Prisma.ContaCorrenteFindUniqueArgs]
    >;
    update: jest.Mock<Promise<ContaCorrente>, [Prisma.ContaCorrenteUpdateArgs]>;
  };
  saleItem: {
    createMany: jest.Mock<
      Promise<Prisma.BatchPayload>,
      [Prisma.SaleItemCreateManyArgs]
    >;
  };
  stockMovement: {
    create: jest.Mock<Promise<StockMovement>, [Prisma.StockMovementCreateArgs]>;
  };
  transacao: {
    create: jest.Mock<Promise<Transacao>, [Prisma.TransacaoCreateArgs]>;
  };
  accountRec: {
    createMany: jest.Mock<
      Promise<Prisma.BatchPayload>,
      [Prisma.AccountRecCreateManyArgs]
    >;
  };
  $transaction: jest.Mock<
    Promise<any>,
    [(tx: Prisma.TransactionClient) => Promise<any>]
  >;
};

// CORREÇÃO: Os tipos de Retorno e Argumentos são passados diretamente para jest.fn()
// Isso cria um mock já tipado corretamente, evitando o erro de "unsafe assignment".
const mockPrismaService: MockPrismaService = {
  sale: {
    create: jest.fn<Promise<Sale>, [Prisma.SaleCreateArgs]>(),
    findMany: jest.fn<Promise<Sale[]>, [Prisma.SaleFindManyArgs]>(),
    findUnique: jest.fn<Promise<Sale | null>, [Prisma.SaleFindUniqueArgs]>(),
    update: jest.fn<Promise<Sale>, [Prisma.SaleUpdateArgs]>(),
    delete: jest.fn<Promise<Sale>, [Prisma.SaleDeleteArgs]>(),
  },
  client: {
    findUnique: jest.fn<
      Promise<Client | null>,
      [Prisma.ClientFindUniqueArgs]
    >(),
  },
  product: {
    findMany: jest.fn<Promise<Product[]>, [Prisma.ProductFindManyArgs]>(),
    update: jest.fn<Promise<Product>, [Prisma.ProductUpdateArgs]>(),
  },
  contaContabil: {
    findUnique: jest.fn<
      Promise<ContaContabil | null>,
      [Prisma.ContaContabilFindUniqueArgs]
    >(),
  },
  contaCorrente: {
    findUnique: jest.fn<
      Promise<ContaCorrente | null>,
      [Prisma.ContaCorrenteFindUniqueArgs]
    >(),
    update: jest.fn<Promise<ContaCorrente>, [Prisma.ContaCorrenteUpdateArgs]>(),
  },
  saleItem: {
    createMany: jest.fn<
      Promise<Prisma.BatchPayload>,
      [Prisma.SaleItemCreateManyArgs]
    >(),
  },
  stockMovement: {
    create: jest.fn<Promise<StockMovement>, [Prisma.StockMovementCreateArgs]>(),
  },
  transacao: {
    create: jest.fn<Promise<Transacao>, [Prisma.TransacaoCreateArgs]>(),
  },
  accountRec: {
    createMany: jest.fn<
      Promise<Prisma.BatchPayload>,
      [Prisma.AccountRecCreateManyArgs]
    >(),
  },
  $transaction: jest
    .fn()
    .mockImplementation(
      async (callback: (tx: Prisma.TransactionClient) => Promise<any>) => {
        const txClient = {
          sale: mockPrismaService.sale,
          client: mockPrismaService.client,
          product: mockPrismaService.product,
          contaContabil: mockPrismaService.contaContabil,
          contaCorrente: mockPrismaService.contaCorrente,
          saleItem: mockPrismaService.saleItem,
          stockMovement: mockPrismaService.stockMovement,
          transacao: mockPrismaService.transacao,
          accountRec: mockPrismaService.accountRec,
        };
        return callback(txClient as unknown as Prisma.TransactionClient);
      },
    ),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: CalculateSaleAdjustmentUseCase,
          useValue: { execute: jest.fn() }
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Legacy 'create' tests removed as the method was refactored into a Use Case.
});
