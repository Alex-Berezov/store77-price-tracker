import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Disconnect after each test to clean up
    await service.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be instance of PrismaClient', () => {
    expect(service).toBeInstanceOf(PrismaService);
  });

  it('should have $connect method', () => {
    expect(typeof service.$connect).toBe('function');
  });

  it('should have $disconnect method', () => {
    expect(typeof service.$disconnect).toBe('function');
  });

  it('should have onModuleInit lifecycle hook', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });

  it('should have onModuleDestroy lifecycle hook', () => {
    expect(typeof service.onModuleDestroy).toBe('function');
  });
});
