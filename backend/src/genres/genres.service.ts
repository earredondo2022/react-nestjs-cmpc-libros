import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre)
    private genreModel: typeof Genre,
  ) {}

  async create(genreData: {
    name: string;
    description?: string;
  }): Promise<Genre> {
    return this.genreModel.create(genreData);
  }

  async findAll(): Promise<Genre[]> {
    return this.genreModel.findAll();
  }

  async findById(id: string): Promise<Genre | null> {
    return this.genreModel.findByPk(id);
  }

  async update(id: string, genreData: Partial<Genre>): Promise<Genre | null> {
    const [updatedRowsCount] = await this.genreModel.update(genreData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deletedRowsCount = await this.genreModel.destroy({
      where: { id },
    });

    return deletedRowsCount > 0;
  }
}