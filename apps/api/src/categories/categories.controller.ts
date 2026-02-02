import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoriesListResponse, CategoriesTreeResponse } from './dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get all categories
   * Optionally returns hierarchical tree structure
   */
  @Get()
  @ApiOperation({
    summary: 'Получить список категорий',
    description:
      'Возвращает список всех категорий. При tree=true возвращает иерархическую структуру',
  })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: String,
    description: 'Если "true", возвращает иерархическое дерево категорий',
  })
  @ApiResponse({ status: 200, description: 'Список категорий' })
  async findAll(
    @Query('tree') tree?: string
  ): Promise<CategoriesListResponse | CategoriesTreeResponse> {
    this.logger.log(`GET /categories - tree=${tree}`);

    if (tree === 'true') {
      return this.categoriesService.findTree();
    }

    return this.categoriesService.findAll();
  }
}
