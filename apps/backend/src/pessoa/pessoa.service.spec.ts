import { Test, TestingModule } from '@nestjs/testing';
import { PessoaService } from './pessoa.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PessoaService', () => {
  let service: PessoaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaService,
        {
          provide: PrismaService,
          useValue: {
            pessoa: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
            client: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
            fornecedor: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            funcionario: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
            sale: { count: jest.fn() },
            $transaction: jest.fn((cb) => cb(prisma)),
          }
        },
      ],
    }).compile();

    service = module.get<PessoaService>(PessoaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
