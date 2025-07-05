import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { Client } from '@prisma/client';

// 1. Criamos um mock mais detalhado do PrismaService
const mockPrismaService = {
  client: {
    findMany: jest.fn(), // Simulamos a função findMany
    create: jest.fn(),
    // Adicione outras funções do Prisma que você for usar nos testes
  },
};

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    // Pegamos a instância do nosso mock para usar nos testes
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Limpa os mocks depois de cada teste para não interferirem um no outro
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 2. Testes específicos para o método 'findAll'
  describe('findAll', () => {
    it('deve retornar um array de clientes', async () => {
      // Arrange (Preparação): Definimos um resultado falso
      const mockUserId = 'user-uuid-123';
      const mockClients: Client[] = [
        {
          id: 'client-uuid-1',
          name: 'Cliente 1',
          userId: mockUserId,
          email: 'c1@test.com',
          phone: null,
          address: null,
          birthDate: null,
          gender: null,
          preferences: null,
          purchaseHistory: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'client-uuid-2',
          name: 'Cliente 2',
          userId: mockUserId,
          email: 'c2@test.com',
          phone: null,
          address: null,
          birthDate: null,
          gender: null,
          preferences: null,
          purchaseHistory: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Dizemos ao nosso mock para retornar a lista falsa quando `findMany` for chamado
      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      // Act (Ação): Executamos o método a ser testado
      const result = await service.findAll(mockUserId);

      // Assert (Verificação): Verificamos se o resultado é o esperado
      expect(result).toEqual(mockClients);
      // Verificamos se o método do prisma foi chamado com os argumentos corretos
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });
});
