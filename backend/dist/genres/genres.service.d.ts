import { Genre } from './entities/genre.entity';
export declare class GenresService {
    private genreModel;
    constructor(genreModel: typeof Genre);
    create(genreData: {
        name: string;
        description?: string;
    }): Promise<Genre>;
    findAll(): Promise<Genre[]>;
    findById(id: string): Promise<Genre | null>;
    update(id: string, genreData: Partial<Genre>): Promise<Genre | null>;
    remove(id: string): Promise<boolean>;
}
