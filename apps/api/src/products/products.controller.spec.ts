import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PaginatedProductsResponse, ProductResponseDto } from './dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  const mockProductResponse: ProductResponseDto = {
    id: 'test-id',
    externalId: 'ext-123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    originalPriceRub: 5000,
    finalPriceRub: 4000,
    finalPriceUsd: 40,
    imageUrl: 'https://example.com/image.jpg',
    externalUrl: 'https://store77.net/product/123',
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockPaginatedResponse: PaginatedProductsResponse = {
    data: [mockProductResponse],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    exchangeRate: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      productsService.findAll = jest.fn().mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(mockPaginatedResponse);
      expect(productsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('should pass query parameters to service', async () => {
      productsService.findAll = jest.fn().mockResolvedValue(mockPaginatedResponse);

      await controller.findAll({
        page: 2,
        limit: 10,
        category: 'phones',
        search: 'iphone',
      });

      expect(productsService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        category: 'phones',
        search: 'iphone',
      });
    });
  });

  describe('findOne', () => {
    it('should return single product', async () => {
      productsService.findOne = jest.fn().mockResolvedValue(mockProductResponse);

      const result = await controller.findOne('test-id');

      expect(result).toEqual(mockProductResponse);
      expect(productsService.findOne).toHaveBeenCalledWith('test-id');
    });
  });
});
