import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesListResponse, CategoriesTreeResponse } from './dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockListResponse: CategoriesListResponse = {
    data: [
      {
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
        url: 'https://store77.net/electronics',
        parentId: null,
        productCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    ],
    total: 1,
  };

  const mockTreeResponse: CategoriesTreeResponse = {
    data: [
      {
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
        url: 'https://store77.net/electronics',
        parentId: null,
        productCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        children: [
          {
            id: 'cat-2',
            name: 'Phones',
            slug: 'phones',
            url: 'https://store77.net/phones',
            parentId: 'cat-1',
            productCount: 5,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
          },
        ],
      },
    ],
    total: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findAll: jest.fn(),
            findTree: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return flat list of categories by default', async () => {
      categoriesService.findAll = jest.fn().mockResolvedValue(mockListResponse);

      const result = await controller.findAll();

      expect(result).toEqual(mockListResponse);
      expect(categoriesService.findAll).toHaveBeenCalled();
      expect(categoriesService.findTree).not.toHaveBeenCalled();
    });

    it('should return tree when tree=true', async () => {
      categoriesService.findTree = jest.fn().mockResolvedValue(mockTreeResponse);

      const result = await controller.findAll('true');

      expect(result).toEqual(mockTreeResponse);
      expect(categoriesService.findTree).toHaveBeenCalled();
      expect(categoriesService.findAll).not.toHaveBeenCalled();
    });

    it('should return flat list when tree=false', async () => {
      categoriesService.findAll = jest.fn().mockResolvedValue(mockListResponse);

      const result = await controller.findAll('false');

      expect(result).toEqual(mockListResponse);
      expect(categoriesService.findAll).toHaveBeenCalled();
    });
  });
});
