import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';
export declare class AuthorsController {
    private readonly authorsService;
    constructor(authorsService: AuthorsService);
    findAll(): Promise<Author[]>;
}
