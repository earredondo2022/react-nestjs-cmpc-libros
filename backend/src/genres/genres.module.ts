import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';

@Module({
  imports: [SequelizeModule.forFeature([Genre])],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService],
})
export class GenresModule {}