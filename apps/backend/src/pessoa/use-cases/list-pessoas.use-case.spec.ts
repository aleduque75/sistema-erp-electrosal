import { ListPessoasUseCase } from './list-pessoas.use-case';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaEntity } from '../entities/pessoa.entity';
import { PessoaType } from '@prisma/client';

describe('ListPessoasUseCase', () => {
  let useCase: ListPessoasUseCase;
  let mockRepository: jest.Mocked<PessoaRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
    } as any;

    useCase = new ListPessoasUseCase(mockRepository);
  });

  it('should list pessoas and format with PessoaMapper', async () => {
    mockRepository.findAll.mockResolvedValue([
      PessoaEntity.create({
        id: 'p-1',
        organizationId: 'org-1',
        name: 'Cliente Alpha',
        type: PessoaType.FISICA,
        roles: ['CLIENT'],
      }),
    ]);

    const result = await useCase.execute('org-1', { role: 'CLIENT' });

    expect(mockRepository.findAll).toHaveBeenCalledWith('org-1', {
      role: 'CLIENT',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p-1');
    expect(result[0].name).toBe('Cliente Alpha');
    expect(result[0].roles).toContain('CLIENT');
  });
});
