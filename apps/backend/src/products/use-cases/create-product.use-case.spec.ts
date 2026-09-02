import { CreateProductUseCase } from './create-product.use-case';
import { ProductRepository } from '../repositories/product.repository';
import { ProductEntity } from '../entities/product.entity';
import { BadRequestException } from '@nestjs/common';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
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

    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should throw BadRequestException if product group does not exist', async () => {
    mockRepository.findProductGroupById.mockResolvedValue(null);

    await expect(
      useCase.execute('org-1', {
        name: 'Prata 999',
        price: 50,
        stock: 10,
        productGroupId: 'invalid-group',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create a product', async () => {
    mockRepository.findProductGroupById.mockResolvedValue({ id: 'group-1' });
    mockRepository.create.mockImplementation(async (p) => {
      return ProductEntity.create({
        id: 'p-new',
        organizationId: p.organizationId,
        name: p.name,
        price: p.price,
        stock: p.stock,
      });
    });

    const result = await useCase.execute('org-1', {
      name: 'Prata 999',
      price: 50,
      stock: 10,
      productGroupId: 'group-1',
    });

    expect(result.id).toBe('p-new');
    expect(result.name).toBe('Prata 999');
    expect(result.price).toBe(50);
  });
});
