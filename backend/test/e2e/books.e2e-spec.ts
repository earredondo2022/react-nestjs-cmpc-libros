import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper, setupTestEnvironment, teardownTestEnvironment, TestDataFactory } from '../test-helper';

describe('Books API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let testData: any;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    testData = await TestHelper.seedTestData();
    authToken = await TestHelper.getAuthToken(app);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean and reseed data for each test
    await TestHelper.cleanDatabase();
    testData = await TestHelper.seedTestData();
  });

  describe('GET /books', () => {
    it('should return all books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should return books with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?page=1&limit=5')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter books by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?search=Test')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('title');
        expect(response.body.data[0].title).toContain('Test');
      }
    });

    it('should filter books by author', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books?authorId=${testData.author.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].authorId).toBe(testData.author.id);
      }
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/books')
        .expect(401);
    });
  });

  describe('GET /books/:id', () => {
    it('should return a specific book', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${testData.book.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', testData.book.id);
      expect(response.body).toHaveProperty('title', 'Test Book');
      expect(response.body).toHaveProperty('isbn');
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('publisher');
      expect(response.body).toHaveProperty('genre');
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentId = 'non-existent-id';
      await request(app.getHttpServer())
        .get(`/books/${nonExistentId}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/books/${testData.book.id}`)
        .expect(401);
    });
  });

  describe('POST /books', () => {
    it('should create a new book', async () => {
      const newBookData = TestDataFactory.createBookData({
        title: 'New Test Book',
        isbn: '978-0-987654-32-1',
        authorId: testData.author.id,
        publisherId: testData.publisher.id,
        genreId: testData.genre.id,
      });

      const response = await request(app.getHttpServer())
        .post('/books')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(newBookData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'New Test Book');
      expect(response.body).toHaveProperty('isbn', '978-0-987654-32-1');
      expect(response.body).toHaveProperty('authorId', testData.author.id);
      expect(response.body).toHaveProperty('publisherId', testData.publisher.id);
      expect(response.body).toHaveProperty('genreId', testData.genre.id);
    });

    it('should return 400 for invalid book data', async () => {
      const invalidBookData = {
        title: '', // Empty title should fail validation
        isbn: 'invalid-isbn',
      };

      await request(app.getHttpServer())
        .post('/books')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(invalidBookData)
        .expect(400);
    });

    it('should return 400 for duplicate ISBN', async () => {
      const duplicateISBN = TestDataFactory.createBookData({
        isbn: testData.book.isbn, // Use existing ISBN
        authorId: testData.author.id,
        publisherId: testData.publisher.id,
        genreId: testData.genre.id,
      });

      await request(app.getHttpServer())
        .post('/books')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(duplicateISBN)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const newBookData = TestDataFactory.createBookData();

      await request(app.getHttpServer())
        .post('/books')
        .send(newBookData)
        .expect(401);
    });
  });

  describe('PUT /books/:id', () => {
    it('should update an existing book', async () => {
      const updateData = {
        title: 'Updated Test Book',
        summary: 'Updated summary',
        price: 30000,
      };

      const response = await request(app.getHttpServer())
        .put(`/books/${testData.book.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Test Book');
      expect(response.body).toHaveProperty('summary', 'Updated summary');
      expect(response.body).toHaveProperty('price', 30000);
    });

    it('should return 404 for non-existent book', async () => {
      const updateData = { title: 'Updated Title' };
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .put(`/books/${nonExistentId}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .send(updateData)
        .expect(404);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        price: -100, // Negative price should fail validation
      };

      await request(app.getHttpServer())
        .put(`/books/${testData.book.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .send(invalidUpdateData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const updateData = { title: 'Updated Title' };

      await request(app.getHttpServer())
        .put(`/books/${testData.book.id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /books/:id', () => {
    it('should soft delete a book', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${testData.book.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      // Verify book is soft deleted (should return 404 when trying to get it)
      await request(app.getHttpServer())
        .get(`/books/${testData.book.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(404);
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .delete(`/books/${nonExistentId}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${testData.book.id}`)
        .expect(401);
    });
  });

  describe('POST /books/:id/upload-cover', () => {
    it('should upload book cover image', async () => {
      // Create a simple buffer to simulate file upload
      const imageBuffer = Buffer.from('fake-image-data');

      const response = await request(app.getHttpServer())
        .post(`/books/${testData.book.id}/upload-cover`)
        .set(TestHelper.createAuthHeaders(authToken))
        .attach('cover', imageBuffer, 'test-cover.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('coverUrl');
    });

    it('should return 404 for non-existent book', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .post(`/books/${nonExistentId}/upload-cover`)
        .set(TestHelper.createAuthHeaders(authToken))
        .attach('cover', imageBuffer, 'test-cover.jpg')
        .expect(404);
    });

    it('should return 400 without file', async () => {
      await request(app.getHttpServer())
        .post(`/books/${testData.book.id}/upload-cover`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      await request(app.getHttpServer())
        .post(`/books/${testData.book.id}/upload-cover`)
        .attach('cover', imageBuffer, 'test-cover.jpg')
        .expect(401);
    });
  });

  describe('GET /books/export/csv', () => {
    it('should export books to CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/export/csv')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('ID,Título,ISBN,Autor,Editorial,Género');
      expect(response.text).toContain('Test Book');
    });

    it('should export filtered books to CSV', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/export/csv?authorId=${testData.author.id}`)
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Test Book');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/books/export/csv')
        .expect(401);
    });
  });

  describe('GET /books/search', () => {
    it('should search books by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search?q=Test')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0].title.toLowerCase()).toContain('test');
      }
    });

    it('should return empty array for non-matching search', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search?q=NonExistentBook')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/books/search?q=Test')
        .expect(401);
    });
  });
});