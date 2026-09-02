import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepository } from '../repositories/product.repository';
import { ProductEntity } from '../entities/product.entity';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
    } as any;

    useCase = new ListProductsUseCase(mockRepository);
  });

  it('should list products and map to response DTO', async () => {
    mockRepository.findAll.mockResolvedValue([
      ProductEntity.create({
        id: 'p-1',
        organizationId: 'org-1',
        name: 'Produto Teste',
        price: 150,
        stock: 20,
      }),
    ]);

    const result = await useCase.execute('org-1', { search: 'Teste' });
    expect(mockRepository.findAll).toHaveBeenCalledWith('org-1', {
      search: 'Teste',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p-1');
    expect(result[0].name).toBe('Produto Teste');
  });
});
