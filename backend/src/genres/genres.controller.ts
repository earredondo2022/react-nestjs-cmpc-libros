import { Controller, Get, Post, Patch, Delete, BadRequestException, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { CreatedAt } from 'sequelize-typescript';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ status: 200, description: 'Return all genres', type: [Genre] })
  async findAll(): Promise<Genre[]> {
    return this.genresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  @ApiParam({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Return genre by ID', type: Genre })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async findById(@Param('id') id: string): Promise<Genre | null> {
    return this.genresService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new genre' })
  @ApiBody({ 
    description: 'Genre data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Science Fiction' },
        description: { type: 'string', example: 'Books about future technology and space' }
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'Genre created successfully', type: Genre })
  @ApiResponse({ status: 400, description: 'Bad request - Name is required' })
  async create(@Body() genreData: { name: string; description?: string }): Promise<Genre> {

    // validar name
    if (!genreData.name) {
      throw new BadRequestException('Name is required');
    }

    return this.genresService.create(genreData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update genre by ID' })
  @ApiParam({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Updated genre data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Fantasy' },
        description: { type: 'string', example: 'Books with magical elements' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Genre updated successfully', type: Genre })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async update(@Param('id') id: string, @Body() genreData: Partial<Genre>): Promise<Genre | null> {
    return this.genresService.update(id, genreData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID' })
  @ApiParam({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Genre deleted successfully', schema: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } } })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.genresService.remove(id);
    return { deleted };
  }
}