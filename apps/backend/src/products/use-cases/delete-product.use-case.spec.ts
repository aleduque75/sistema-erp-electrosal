import { DeleteProductUseCase } from './delete-product.use-case';
import { ProductRepository } from '../repositories/product.repository';
import { ProductEntity } from '../entities/product.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      hasSaleItems: jest.fn(),
      hasInventoryLots: jest.fn(),
      hasStockMovements: jest.fn(),
      findProductGroupById: jest.fn(),
      findAllProductGroups: jest.fn(),
      findProductGroupByName: jest.fn(),
      updateProductGroup: jest.fn(),
    } as any;

    useCase = new DeleteProductUseCase(mockRepository);
  });

  it('should throw NotFoundException if product does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'prod-99')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ConflictException if product is linked to sales', async () => {
    mockRepository.findById.mockResolvedValue(
      ProductEntity.create({
        id: 'prod-1',
        organizationId: 'org-1',
        name: 'Ouro',
        price: 100,
        stock: 5,
      }),
    );
    mockRepository.hasSaleItems.mockResolvedValue(true);

    await expect(useCase.execute('org-1', 'prod-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should successfully delete when there are no constraints', async () => {
    mockRepository.findById.mockResolvedValue(
      ProductEntity.create({
        id: 'prod-1',
        organizationId: 'org-1',
        name: 'Ouro',
        price: 100,
        stock: 5,
      }),
    );
    mockRepository.hasSaleItems.mockResolvedValue(false);
    mockRepository.hasInventoryLots.mockResolvedValue(false);
    mockRepository.hasStockMovements.mockResolvedValue(false);

    const result = await useCase.execute('org-1', 'prod-1');
    expect(mockRepository.delete).toHaveBeenCalledWith('prod-1', 'org-1');
    expect(result.message).toContain('sucesso');
  });
});
