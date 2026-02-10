import { Test, TestingModule } from '@nestjs/testing';
import { BackupsController } from './backups.controller';
import { BackupsService } from './backups.service';

describe('BackupsController', () => {
  let controller: BackupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupsController],
      providers: [
        {
          provide: BackupsService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            restore: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BackupsController>(BackupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
