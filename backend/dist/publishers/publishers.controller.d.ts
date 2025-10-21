import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';
export declare class PublishersController {
    private readonly publishersService;
    constructor(publishersService: PublishersService);
    findAll(): Promise<Publisher[]>;
}
