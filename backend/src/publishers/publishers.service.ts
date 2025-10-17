import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Publisher } from './entities/publisher.entity';

@Injectable()
export class PublishersService {
  constructor(
    @InjectModel(Publisher)
    private publisherModel: typeof Publisher,
  ) {}

  async create(publisherData: {
    name: string;
    country?: string;
    foundedYear?: number;
  }): Promise<Publisher> {
    return this.publisherModel.create(publisherData);
  }

  async findAll(): Promise<Publisher[]> {
    return this.publisherModel.findAll();
  }

  async findById(id: string): Promise<Publisher | null> {
    return this.publisherModel.findByPk(id);
  }

  async update(id: string, publisherData: Partial<Publisher>): Promise<Publisher | null> {
    const [updatedRowsCount] = await this.publisherModel.update(publisherData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deletedRowsCount = await this.publisherModel.destroy({
      where: { id },
    });

    return deletedRowsCount > 0;
  }
}