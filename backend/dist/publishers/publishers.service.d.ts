import { Publisher } from './entities/publisher.entity';
export declare class PublishersService {
    private publisherModel;
    constructor(publisherModel: typeof Publisher);
    create(publisherData: {
        name: string;
        country?: string;
        foundedYear?: number;
    }): Promise<Publisher>;
    findAll(): Promise<Publisher[]>;
    findById(id: string): Promise<Publisher | null>;
    update(id: string, publisherData: Partial<Publisher>): Promise<Publisher | null>;
    remove(id: string): Promise<boolean>;
}
