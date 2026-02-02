import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    url: 'https://store77.net/electronics',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockChildCategory = {
    id: 'cat-2',
    name: 'Phones',
    slug: 'phones',
    url: 'https://store77.net/phones',
    parentId: 'cat-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with product counts', async () => {
      const categoriesWithCount = [
        { ...mockCategory, _count: { products: 10 } },
        { ...mockChildCategory, _count: { products: 5 } },
      ];

      prismaService.category.findMany = jest.fn().mockResolvedValue(categoriesWithCount);

      const result = await service.findAll();

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.name).toBe('Electronics');
      expect(result.data[0]!.productCount).toBe(10);
      expect(result.data[1]!.productCount).toBe(5);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should return empty list when no categories', async () => {
      prismaService.category.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.findAll();

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findTree', () => {
    it('should return hierarchical tree of categories', async () => {
      const rootWithChildren = [
        {
          ...mockCategory,
          _count: { products: 10 },
          children: [{ ...mockChildCategory, _count: { products: 5 } }],
        },
      ];

      prismaService.category.findMany = jest.fn().mockResolvedValue(rootWithChildren);

      const result = await service.findTree();

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.name).toBe('Electronics');
      expect(result.data[0]!.children).toHaveLength(1);
      expect(result.data[0]!.children[0]!.name).toBe('Phones');

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
          children: {
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: { products: true },
              },
            },
          },
        },
      });
    });

    it('should return empty tree when no root categories', async () => {
      prismaService.category.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.findTree();

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      prismaService.category.findUnique = jest.fn().mockResolvedValue({
        ...mockCategory,
        _count: { products: 10 },
      });

      const result = await service.findBySlug('electronics');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('electronics');
      expect(result?.productCount).toBe(10);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should return null when category not found', async () => {
      prismaService.category.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('should return total count of categories', async () => {
      prismaService.category.count = jest.fn().mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
