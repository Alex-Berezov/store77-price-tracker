import { Controller, Get, Param, Query, Logger, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto, ProductResponseDto, PaginatedProductsResponse } from './dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get paginated list of products
   * Supports filtering by category and search term
   */
  @Get()
  @ApiOperation({
    summary: 'Получить список товаров',
    description:
      'Возвращает пагинированный список товаров с возможностью фильтрации по категории и поиска',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (по умолчанию 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество на странице (по умолчанию 20, макс. 100)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Slug категории для фильтрации',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Поисковый запрос' })
  @ApiResponse({ status: 200, description: 'Список товаров с пагинацией' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ProductQueryDto
  ): Promise<PaginatedProductsResponse> {
    this.logger.log(
      `GET /products - page=${query.page}, limit=${query.limit}, category=${query.category}, search=${query.search}`
    );
    return this.productsService.findAll(query);
  }

  /**
   * Get single product by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Получить товар по ID',
    description: 'Возвращает детальную информацию о товаре включая цену в USD',
  })
  @ApiParam({ name: 'id', description: 'ID товара' })
  @ApiResponse({ status: 200, description: 'Информация о товаре' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.log(`GET /products/${id}`);
    return this.productsService.findOne(id);
  }
}
