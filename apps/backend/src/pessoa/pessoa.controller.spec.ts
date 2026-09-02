import { Test, TestingModule } from '@nestjs/testing';
import { PessoaController } from './pessoa.controller';
import { CreatePessoaUseCase } from './use-cases/create-pessoa.use-case';
import { UpdatePessoaUseCase } from './use-cases/update-pessoa.use-case';
import { ListPessoasUseCase } from './use-cases/list-pessoas.use-case';
import { GetPessoaUseCase } from './use-cases/get-pessoa.use-case';
import { DeletePessoaUseCase } from './use-cases/delete-pessoa.use-case';
import { PessoaType } from '@prisma/client';

describe('PessoaController', () => {
  let controller: PessoaController;
  let createPessoaUseCase: jest.Mocked<CreatePessoaUseCase>;
  let updatePessoaUseCase: jest.Mocked<UpdatePessoaUseCase>;
  let listPessoasUseCase: jest.Mocked<ListPessoasUseCase>;
  let getPessoaUseCase: jest.Mocked<GetPessoaUseCase>;
  let deletePessoaUseCase: jest.Mocked<DeletePessoaUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PessoaController],
      providers: [
        {
          provide: CreatePessoaUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdatePessoaUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListPessoasUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetPessoaUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeletePessoaUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PessoaController>(PessoaController);
    createPessoaUseCase = module.get(CreatePessoaUseCase);
    updatePessoaUseCase = module.get(UpdatePessoaUseCase);
    listPessoasUseCase = module.get(ListPessoasUseCase);
    getPessoaUseCase = module.get(GetPessoaUseCase);
    deletePessoaUseCase = module.get(DeletePessoaUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create to CreatePessoaUseCase', async () => {
    const dto = { name: 'Empresa X', type: PessoaType.JURIDICA };
    createPessoaUseCase.execute.mockResolvedValue({ id: 'p-1', ...dto } as any);

    const result = await controller.create('org-1', dto as any);
    expect(createPessoaUseCase.execute).toHaveBeenCalledWith('org-1', dto);
    expect(result.id).toBe('p-1');
  });

  it('should delegate findAll to ListPessoasUseCase', async () => {
    listPessoasUseCase.execute.mockResolvedValue([{ id: 'p-1' }] as any);

    const result = await controller.findAll('org-1', 'CLIENT');
    expect(listPessoasUseCase.execute).toHaveBeenCalledWith('org-1', 'CLIENT');
    expect(result).toHaveLength(1);
  });

  it('should delegate findOne to GetPessoaUseCase', async () => {
    getPessoaUseCase.execute.mockResolvedValue({ id: 'p-1' } as any);

    const result = await controller.findOne('org-1', 'p-1');
    expect(getPessoaUseCase.execute).toHaveBeenCalledWith('org-1', 'p-1');
    expect(result.id).toBe('p-1');
  });

  it('should delegate update to UpdatePessoaUseCase', async () => {
    const dto = { name: 'Novo Nome' };
    updatePessoaUseCase.execute.mockResolvedValue({ id: 'p-1', ...dto } as any);

    const result = await controller.update('org-1', 'p-1', dto);
    expect(updatePessoaUseCase.execute).toHaveBeenCalledWith('org-1', 'p-1', dto);
    expect(result.name).toBe('Novo Nome');
  });

  it('should delegate remove to DeletePessoaUseCase', async () => {
    deletePessoaUseCase.execute.mockResolvedValue({ message: 'Removido com sucesso.' });

    const result = await controller.remove('org-1', 'p-1');
    expect(deletePessoaUseCase.execute).toHaveBeenCalledWith('org-1', 'p-1');
    expect(result.message).toContain('sucesso');
  });
});
