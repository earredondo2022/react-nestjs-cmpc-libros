import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
export declare class GenresController {
    private readonly genresService;
    constructor(genresService: GenresService);
    findAll(): Promise<Genre[]>;
}
