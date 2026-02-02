/**
 * Integration tests for Categories API endpoints
 * Tests the complete request/response flow
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma';

describe('Categories API Integration', () => {
  let app: INestApplication;
  let _categoriesService: CategoriesService;

  // Mock data
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Apple iPhone',
      slug: 'apple-iphone',
      url: 'https://store77.net/apple-iphone/',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { products: 150 },
    },
    {
      id: 'cat-2',
      name: 'iPhone 16 Pro',
      slug: 'iphone-16-pro',
      url: 'https://store77.net/iphone-16-pro/',
      parentId: 'cat-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { products: 45 },
    },
    {
      id: 'cat-3',
      name: 'Samsung Galaxy',
      slug: 'samsung-galaxy',
      url: 'https://store77.net/samsung-galaxy/',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { products: 120 },
    },
  ];

  const mockRootCategories = [
    {
      id: 'cat-1',
      name: 'Apple iPhone',
      slug: 'apple-iphone',
      url: 'https://store77.net/apple-iphone/',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { products: 150 },
      children: [
        {
          id: 'cat-2',
          name: 'iPhone 16 Pro',
          slug: 'iphone-16-pro',
          url: 'https://store77.net/iphone-16-pro/',
          parentId: 'cat-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { products: 45 },
        },
      ],
    },
    {
      id: 'cat-3',
      name: 'Samsung Galaxy',
      slug: 'samsung-galaxy',
      url: 'https://store77.net/samsung-galaxy/',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { products: 120 },
      children: [],
    },
  ];

  const mockPrismaService = {
    category: {
      findMany: jest.fn().mockImplementation((args) => {
        if (args?.where?.parentId === null) {
          return Promise.resolve(mockRootCategories);
        }
        return Promise.resolve(mockCategories);
      }),
      findUnique: jest.fn().mockImplementation(({ where: { slug } }) => {
        const category = mockCategories.find((c) => c.slug === slug);
        return Promise.resolve(category || null);
      }),
      count: jest.fn().mockResolvedValue(3),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    _categoriesService = moduleRef.get<CategoriesService>(CategoriesService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('should return flat list of categories', async () => {
      const response = await request(app.getHttpServer()).get('/categories').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should return correct category structure', async () => {
      const response = await request(app.getHttpServer()).get('/categories').expect(200);

      const category = response.body.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('url');
      expect(category).toHaveProperty('productCount');
      expect(category).toHaveProperty('createdAt');
      expect(category).toHaveProperty('updatedAt');
    });

    it('should include product counts', async () => {
      const response = await request(app.getHttpServer()).get('/categories').expect(200);

      const appleCategory = response.body.data.find(
        (c: { slug: string }) => c.slug === 'apple-iphone'
      );
      expect(appleCategory.productCount).toBe(150);
    });
  });

  describe('GET /categories?tree=true', () => {
    it('should return hierarchical tree of categories', async () => {
      const response = await request(app.getHttpServer()).get('/categories?tree=true').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only root categories
    });

    it('should include children in tree response', async () => {
      const response = await request(app.getHttpServer()).get('/categories?tree=true').expect(200);

      const appleCategory = response.body.data.find(
        (c: { slug: string }) => c.slug === 'apple-iphone'
      );
      expect(appleCategory).toHaveProperty('children');
      expect(Array.isArray(appleCategory.children)).toBe(true);
      expect(appleCategory.children).toHaveLength(1);
      expect(appleCategory.children[0].slug).toBe('iphone-16-pro');
    });

    it('should return empty children array for categories without subcategories', async () => {
      const response = await request(app.getHttpServer()).get('/categories?tree=true').expect(200);

      const samsungCategory = response.body.data.find(
        (c: { slug: string }) => c.slug === 'samsung-galaxy'
      );
      expect(samsungCategory.children).toEqual([]);
    });

    it('should count only root categories in total', async () => {
      const response = await request(app.getHttpServer()).get('/categories?tree=true').expect(200);

      expect(response.body.total).toBe(2); // 2 root categories
    });
  });

  describe('Response format', () => {
    it('should return proper JSON content-type', async () => {
      const response = await request(app.getHttpServer()).get('/categories').expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should convert dates to ISO strings', async () => {
      const response = await request(app.getHttpServer()).get('/categories').expect(200);

      const category = response.body.data[0];
      expect(typeof category.createdAt).toBe('string');
      expect(typeof category.updatedAt).toBe('string');
    });
  });
});
