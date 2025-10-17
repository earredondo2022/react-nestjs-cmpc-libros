import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Author } from './entities/author.entity';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author)
    private authorModel: typeof Author,
  ) {}

  async create(authorData: {
    name: string;
    biography?: string;
    birthDate?: Date;
    nationality?: string;
  }): Promise<Author> {
    return this.authorModel.create(authorData);
  }

  async findAll(): Promise<Author[]> {
    return this.authorModel.findAll();
  }

  async findById(id: string): Promise<Author | null> {
    return this.authorModel.findByPk(id);
  }

  async update(id: string, authorData: Partial<Author>): Promise<Author | null> {
    const [updatedRowsCount] = await this.authorModel.update(authorData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deletedRowsCount = await this.authorModel.destroy({
      where: { id },
    });

    return deletedRowsCount > 0;
  }
}