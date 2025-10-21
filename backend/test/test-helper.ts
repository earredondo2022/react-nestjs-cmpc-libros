import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

export class TestHelper {
  private static app: INestApplication;
  private static sequelize: Sequelize;
  private static moduleRef: TestingModule;

  static async createTestApp(): Promise<INestApplication> {
    if (TestHelper.app) {
      return TestHelper.app;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Override database configuration for testing
        SequelizeModule.forRoot({
          dialect: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5433,
          username: process.env.TEST_DB_USERNAME || 'test_user',
          password: process.env.TEST_DB_PASSWORD || 'test_password',
          database: process.env.TEST_DB_NAME || 'test_cmpc_libros',
          autoLoadModels: true,
          synchronize: true,
          logging: false, // Disable logging in tests
        }),
        AppModule,
      ],
    }).compile();

    TestHelper.moduleRef = moduleFixture;
    TestHelper.app = moduleFixture.createNestApplication();
    TestHelper.sequelize = moduleFixture.get<Sequelize>(Sequelize);

    // Configure validation pipe
    TestHelper.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await TestHelper.app.init();
    return TestHelper.app;
  }

  static async closeTestApp(): Promise<void> {
    if (TestHelper.app) {
      await TestHelper.app.close();
      TestHelper.app = null;
    }
    if (TestHelper.moduleRef) {
      await TestHelper.moduleRef.close();
      TestHelper.moduleRef = null;
    }
  }

  static async cleanDatabase(): Promise<void> {
    if (TestHelper.sequelize) {
      // Drop all tables and recreate them
      await TestHelper.sequelize.sync({ force: true });
    }
  }

  static async seedTestData(): Promise<any> {
    if (!TestHelper.sequelize) {
      throw new Error('Database not initialized');
    }

    // Create test user
    const User = TestHelper.sequelize.models.User;
    const testUser = await User.create({
      email: 'test@example.com',
      password: '$2a$10$mBjC92mlR1YPL3Ua1Uewvuju6xKE51LfSrWskEYfbkoshe6cPgdT6', // password123
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    });

    // Create test author
    const Author = TestHelper.sequelize.models.Author;
    const testAuthor = await Author.create({
      name: 'Test Author',
      biography: 'Test biography',
      birthDate: new Date('1980-01-01'),
      nationality: 'Chilean',
    });

    // Create test publisher
    const Publisher = TestHelper.sequelize.models.Publisher;
    const testPublisher = await Publisher.create({
      name: 'Test Publisher',
      address: 'Test Address',
      website: 'https://test.com',
      email: 'publisher@test.com',
    });

    // Create test genre
    const Genre = TestHelper.sequelize.models.Genre;
    const testGenre = await Genre.create({
      name: 'Test Genre',
      description: 'Test genre description',
    });

    // Create test book
    const Book = TestHelper.sequelize.models.Book;
    const testBook = await Book.create({
      title: 'Test Book',
      isbn: '978-0-123456-78-9',
      publishedDate: new Date('2023-01-01'),
      pageCount: 300,
      language: 'Spanish',
      summary: 'Test book summary',
      authorId: (testAuthor as any).id,
      publisherId: (testPublisher as any).id,
      genreId: (testGenre as any).id,
      stock: 10,
      price: 25000,
      location: 'A1-B2-C3',
      isActive: true,
    });

    return {
      user: testUser,
      author: testAuthor,
      publisher: testPublisher,
      genre: testGenre,
      book: testBook,
    };
  }

  static async getAuthToken(app: INestApplication, email = 'test@example.com', password = 'password123'): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.access_token;
  }

  static createAuthHeaders(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  static async createTestUser(app: INestApplication, userData: any = {}): Promise<any> {
    const defaultUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'user',
      ...userData,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(defaultUserData)
      .expect(201);

    return response.body;
  }

  static getApp(): INestApplication {
    return TestHelper.app;
  }

  static getSequelize(): Sequelize {
    return TestHelper.sequelize;
  }
}

// Global test setup
export const setupTestEnvironment = async () => {
  const app = await TestHelper.createTestApp();
  await TestHelper.cleanDatabase();
  return app;
};

// Global test teardown
export const teardownTestEnvironment = async () => {
  await TestHelper.closeTestApp();
};

// Test data factory
export class TestDataFactory {
  static createBookData(overrides: any = {}) {
    return {
      title: 'Test Book Title',
      isbn: '978-0-123456-78-9',
      publishedDate: '2023-01-01',
      pageCount: 300,
      language: 'Spanish',
      summary: 'Test book summary',
      stock: 10,
      price: 25000,
      location: 'A1-B2-C3',
      ...overrides,
    };
  }

  static createAuthorData(overrides: any = {}) {
    return {
      name: 'Test Author Name',
      biography: 'Test author biography',
      birthDate: '1980-01-01',
      nationality: 'Chilean',
      ...overrides,
    };
  }

  static createPublisherData(overrides: any = {}) {
    return {
      name: 'Test Publisher Name',
      address: 'Test Publisher Address',
      website: 'https://testpublisher.com',
      email: 'publisher@test.com',
      ...overrides,
    };
  }

  static createGenreData(overrides: any = {}) {
    return {
      name: 'Test Genre Name',
      description: 'Test genre description',
      ...overrides,
    };
  }

  static createUserData(overrides: any = {}) {
    return {
      email: 'testuser@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      ...overrides,
    };
  }
}