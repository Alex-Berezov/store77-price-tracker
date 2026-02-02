import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Проверка работоспособности API' })
  @ApiResponse({ status: 200, description: 'API работает нормально' })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
