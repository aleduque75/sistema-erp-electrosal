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
import { Decimal } from '@prisma/client/runtime/library';
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

  describe('create', () => {
    const userId = 'user123';
    const createSaleDto: CreateSaleDto = {
      clientId: 'client123',
      items: [
        { productId: 'prod1', quantity: 2, price: 100 },
        { productId: 'prod2', quantity: 1, price: 50 },
      ],
      paymentMethod: 'Cash',
      totalAmount: 250,
      contaContabilId: 'contaContabil123',
      contaCorrenteId: 'contaCorrente123',
      numberOfInstallments: 1,
      feeAmount: 0,
      netAmount: 250,
    };

    const mockClient: Client = {
      id: 'client123',
      userId,
      name: 'Test Client',
      email: null,
      phone: null,
      address: null,
      birthDate: null,
      gender: null,
      preferences: null,
      purchaseHistory: Prisma.JsonNull,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockContaContabil: ContaContabil = {
      id: 'contaContabil123',
      userId,
      codigo: 'REC001',
      nome: 'Receita de Vendas',
      tipo: 'RECEITA',
      aceitaLancamento: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      contaPaiId: null,
    };
    const mockContaCorrente: ContaCorrente = {
      id: 'contaCorrente123',
      userId,
      numeroConta: '0001',
      saldo: new Decimal(1000),
      moeda: 'BRL',
      dataAbertura: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const mockProduct1: Product = {
      id: 'prod1',
      userId,
      name: 'Product 1',
      description: null,
      price: new Decimal(100),
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockProduct2: Product = {
      id: 'prod2',
      userId,
      name: 'Product 2',
      description: null,
      price: new Decimal(50),
      stock: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockCreatedSale: Sale = {
      id: 'sale123',
      userId,
      clientId: 'client123',
      orderNumber: 'ORDER-XYZ',
      totalAmount: new Decimal(250),
      saleDate: new Date(),
      paymentMethod: 'Cash',
      feeAmount: new Decimal(0),
      netAmount: new Decimal(250),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockCreatedTransaction: Transacao = {
      id: 'trans1',
      createdAt: new Date(),
      updatedAt: new Date(),
      moeda: 'BRL',
      tipo: 'CREDITO',
      valor: new Decimal(250),
      dataHora: new Date(),
      descricao: '',
      contaContabilId: 'contaContabil123',
      contaCorrenteId: 'contaCorrente123',
      userEnvolvidoId: userId,
    };
    const mockCreatedStockMovement: StockMovement = {
      id: 'stock1',
      createdAt: new Date(),
      updatedAt: new Date(),
      tipo: 'SAIDA',
      quantidade: 2,
      motivo: 'VENDA',
      dataHora: new Date(),
      produtoId: 'prod1',
      usuarioId: userId,
    };

    beforeEach(() => {
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.contaContabil.findUnique.mockResolvedValue(
        mockContaContabil,
      );
      mockPrismaService.contaCorrente.findUnique.mockResolvedValue(
        mockContaCorrente,
      );
      mockPrismaService.product.findMany.mockResolvedValue([
        mockProduct1,
        mockProduct2,
      ]);
      mockPrismaService.sale.create.mockResolvedValue(mockCreatedSale);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct1,
        stock: 8,
      });
      mockPrismaService.stockMovement.create.mockResolvedValue(
        mockCreatedStockMovement,
      );
      mockPrismaService.saleItem.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.transacao.create.mockResolvedValue(
        mockCreatedTransaction,
      );
      mockPrismaService.contaCorrente.update.mockResolvedValue({
        ...mockContaCorrente,
        saldo: new Decimal(1250),
      });
      mockPrismaService.accountRec.createMany.mockResolvedValue({ count: 3 });
    });

    it('should create a sale and update stock for a cash payment', async () => {
      const result = await service.create(userId, createSaleDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: createSaleDto.clientId, userId },
      });
      expect(mockPrismaService.contaCorrente.findUnique).toHaveBeenCalledWith({
        where: { id: createSaleDto.contaCorrenteId, userId },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod1', 'prod2'] } },
      });
      expect(mockPrismaService.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId,
            clientId: createSaleDto.clientId,
            orderNumber: expect.any(String),
            totalAmount: new Decimal(createSaleDto.totalAmount),
            feeAmount: new Decimal(createSaleDto.feeAmount!),
            netAmount: new Decimal(createSaleDto.netAmount!),
            saleDate: expect.any(Date),
            paymentMethod: createSaleDto.paymentMethod,
          },
        }),
      );
      expect(mockPrismaService.product.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.transacao.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.contaCorrente.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.accountRec.createMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedSale);
    });

    it('should create a sale and generate accounts receivable for an installment payment', async () => {
      const installmentSaleDto: CreateSaleDto = {
        ...createSaleDto,
        paymentMethod: 'Credit Card',
        numberOfInstallments: 3,
        feeAmount: 30,
        netAmount: 220,
        contaCorrenteId: undefined, // No direct cash deposit
      };

      const result = await service.create(userId, installmentSaleDto);

      // --- Assertions ---
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.contaCorrente.findUnique).not.toHaveBeenCalled(); // Should not be called for installments

      // Check revenue recognition transaction
      expect(mockPrismaService.transacao.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.transacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valor: new Decimal(installmentSaleDto.totalAmount),
            contaCorrenteId: undefined, // No bank account involved at this stage
          }),
        }),
      );

      // Ensure bank account was not updated
      expect(mockPrismaService.contaCorrente.update).not.toHaveBeenCalled();

      // Check creation of accounts receivable
      expect(mockPrismaService.accountRec.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.accountRec.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId,
            saleId: mockCreatedSale.id,
            amount: new Decimal(
              installmentSaleDto.netAmount! / 3,
            ).toDecimalPlaces(2),
            dueDate: expect.any(Date),
            received: false,
          }),
        ]),
        skipDuplicates: true,
      });

      expect(result).toEqual(mockCreatedSale);
    });

    // --- Exception Tests ---

    it('should throw NotFoundException if client is not found', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);
      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado.'),
      );
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      // Simulate one product having insufficient stock
      mockPrismaService.product.findMany.mockResolvedValue([
        { ...mockProduct1, stock: 1 },
      ]);
      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        new BadRequestException(
          `Estoque insuficiente para o produto: ${mockProduct1.name}`,
        ),
      );
    });

    it('should throw BadRequestException if numberOfInstallments is invalid for an installment payment', async () => {
      const invalidDto: CreateSaleDto = {
        ...createSaleDto,
        paymentMethod: 'Credit Card',
        numberOfInstallments: 0, // Invalid number
      };
      await expect(service.create(userId, invalidDto)).rejects.toThrow(
        new BadRequestException(
          'O número de parcelas deve ser maior que zero para pagamentos parcelados.',
        ),
      );
    });
  });
});
