import { Author } from './entities/author.entity';
export declare class AuthorsService {
    private authorModel;
    constructor(authorModel: typeof Author);
    create(authorData: {
        name: string;
        biography?: string;
        birthDate?: Date;
        nationality?: string;
    }): Promise<Author>;
    findAll(): Promise<Author[]>;
    findById(id: string): Promise<Author | null>;
    update(id: string, authorData: Partial<Author>): Promise<Author | null>;
    remove(id: string): Promise<boolean>;
}
