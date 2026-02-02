import { Controller, Get, Query, Res, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ImagesService } from './images.service';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) {}

  @Get('proxy')
  @ApiOperation({
    summary: 'Proxy image from store77.net',
    description:
      'Downloads an image from store77.net using a headless browser to bypass hotlinking protection',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'URL of the image to proxy (must be from store77.net)',
    example: 'https://store77.net/upload/resize_cache/iblock/xxx/image.jpg',
  })
  @ApiResponse({ status: 200, description: 'Image binary data' })
  @ApiResponse({ status: 400, description: 'Missing or invalid URL parameter' })
  @ApiResponse({ status: 404, description: 'Image not found or failed to download' })
  async proxyImage(@Query('url') url: string, @Res() res: Response): Promise<void> {
    if (!url) {
      res.status(HttpStatus.BAD_REQUEST).send('Missing url parameter');
      return;
    }

    // Validate URL is from store77.net
    if (!url.startsWith('https://store77.net/')) {
      res.status(HttpStatus.BAD_REQUEST).send('URL must be from store77.net');
      return;
    }

    try {
      const result = await this.imagesService.getImage(url);

      if (!result) {
        res.status(HttpStatus.NOT_FOUND).send('Failed to download image');
        return;
      }

      // Set response headers
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.data.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Send image data
      res.status(HttpStatus.OK).send(result.data);
    } catch (error) {
      this.logger.error(`Failed to proxy image: ${url}`, error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal server error');
    }
  }
}
