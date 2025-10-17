import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PublishersController } from './publishers.controller';
import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';

@Module({
  imports: [SequelizeModule.forFeature([Publisher])],
  controllers: [PublishersController],
  providers: [PublishersService],
  exports: [PublishersService],
})
export class PublishersModule {}