import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';

@ApiTags('Publishers')
@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all publishers' })
  @ApiResponse({ status: 200, description: 'Return all publishers', type: [Publisher] })
  async findAll(): Promise<Publisher[]> {
    return this.publishersService.findAll();
  }
}