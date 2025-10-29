import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
export declare class GenresController {
    private readonly genresService;
    constructor(genresService: GenresService);
    findAll(): Promise<Genre[]>;
    findById(id: string): Promise<Genre | null>;
    create(genreData: {
        name: string;
        description?: string;
    }): Promise<Genre>;
    update(id: string, genreData: Partial<Genre>): Promise<Genre | null>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
