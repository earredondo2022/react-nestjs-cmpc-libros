import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all authors' })
  @ApiResponse({ status: 200, description: 'Return all authors', type: [Author] })
  async findAll(): Promise<Author[]> {
    return this.authorsService.findAll();
  }
}