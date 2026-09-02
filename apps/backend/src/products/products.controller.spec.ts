import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ListProductsUseCase } from './use-cases/list-products.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { AnalyzeXmlImportUseCase } from './use-cases/analyze-xml-import.use-case';
import { ConfirmXmlImportUseCase } from './use-cases/confirm-xml-import.use-case';
import { FixReactionGroupUseCase } from './use-cases/fix-reaction-group.use-case';
import { GetAllProductGroupsUseCase } from './use-cases/get-all-product-groups.use-case';

describe('ProductsController', () => {
  let controller: ProductsController;
  let listProductsUseCase: jest.Mocked<ListProductsUseCase>;
  let getProductUseCase: jest.Mocked<GetProductUseCase>;
  let createProductUseCase: jest.Mocked<CreateProductUseCase>;
  let updateProductUseCase: jest.Mocked<UpdateProductUseCase>;
  let deleteProductUseCase: jest.Mocked<DeleteProductUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ListProductsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: AnalyzeXmlImportUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ConfirmXmlImportUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FixReactionGroupUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAllProductGroupsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    listProductsUseCase = module.get(ListProductsUseCase);
    getProductUseCase = module.get(GetProductUseCase);
    createProductUseCase = module.get(CreateProductUseCase);
    updateProductUseCase = module.get(UpdateProductUseCase);
    deleteProductUseCase = module.get(DeleteProductUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAll to ListProductsUseCase', async () => {
    listProductsUseCase.execute.mockResolvedValue([{ id: 'p-1' }] as any);
    const query = { search: 'Ouro' };
    const result = await controller.findAll('org-1', '', query);

    expect(listProductsUseCase.execute).toHaveBeenCalledWith('org-1', query);
    expect(result).toHaveLength(1);
  });

  it('should delegate findOne to GetProductUseCase', async () => {
    getProductUseCase.execute.mockResolvedValue({ id: 'p-1', name: 'Ouro' } as any);
    const result = await controller.findOne('org-1', '', 'p-1');

    expect(getProductUseCase.execute).toHaveBeenCalledWith('org-1', 'p-1');
    expect(result.id).toBe('p-1');
  });

  it('should delegate create to CreateProductUseCase', async () => {
    const dto = { name: 'Prata', price: 50, stock: 10 };
    createProductUseCase.execute.mockResolvedValue({ id: 'p-2', ...dto } as any);

    const result = await controller.create('org-1', '', dto as any);
    expect(createProductUseCase.execute).toHaveBeenCalledWith('org-1', dto);
    expect(result.id).toBe('p-2');
  });

  it('should delegate update to UpdateProductUseCase', async () => {
    const dto = { name: 'Prata Fina' };
    updateProductUseCase.execute.mockResolvedValue({ id: 'p-2', ...dto } as any);

    const result = await controller.update('org-1', '', 'p-2', dto);
    expect(updateProductUseCase.execute).toHaveBeenCalledWith('org-1', 'p-2', dto);
    expect(result.name).toBe('Prata Fina');
  });

  it('should delegate remove to DeleteProductUseCase', async () => {
    deleteProductUseCase.execute.mockResolvedValue({ message: 'Excluído com sucesso.' });
    const result = await controller.remove('org-1', '', 'p-2');

    expect(deleteProductUseCase.execute).toHaveBeenCalledWith('org-1', 'p-2');
    expect(result.message).toContain('sucesso');
  });
});
