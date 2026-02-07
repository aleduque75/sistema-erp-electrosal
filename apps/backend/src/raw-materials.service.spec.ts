import { Test, TestingModule } from '@nestjs/testing';
import { RawMaterialsService } from './raw-materials.service';
import { PrismaService } from './prisma/prisma.service';

describe('RawMaterialsService', () => {
  let service: RawMaterialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RawMaterialsService,
        { provide: PrismaService, useValue: { rawMaterial: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } } },
      ],
    }).compile();

    service = module.get<RawMaterialsService>(RawMaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
