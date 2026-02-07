import { Test, TestingModule } from '@nestjs/testing';
import { BackupsService } from './backups.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

describe('BackupsService', () => {
  let service: BackupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
