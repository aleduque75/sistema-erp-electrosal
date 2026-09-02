import { Test, TestingModule } from '@nestjs/testing';
import { SalesMovementImportController } from './sales-movement-import.controller';
import { SalesMovementImportUseCase } from './sales-movement-import.use-case';
import { BadRequestException } from '@nestjs/common';

describe('SalesMovementImportController', () => {
  let controller: SalesMovementImportController;
  let useCase: jest.Mocked<SalesMovementImportUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesMovementImportController],
      providers: [
        {
          provide: SalesMovementImportUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ success: true, count: 10 }) },
        },
      ],
    }).compile();

    controller = module.get<SalesMovementImportController>(SalesMovementImportController);
    useCase = module.get(SalesMovementImportUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException if no file is provided', async () => {
    await expect(controller.uploadFile(null as any, 'org-1', '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should delegate upload to SalesMovementImportUseCase with authenticated organizationId', async () => {
    const fakeFile = {
      buffer: Buffer.from('test;content'),
    } as Express.Multer.File;

    const result = await controller.uploadFile(fakeFile, 'org-tenant-123', '');

    expect(useCase.execute).toHaveBeenCalledWith(fakeFile.buffer, 'org-tenant-123');
    expect(result).toEqual({ success: true, count: 10 });
  });
});
