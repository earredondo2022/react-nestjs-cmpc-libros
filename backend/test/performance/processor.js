// Artillery processor functions for load testing

const faker = require('faker');

// Available book IDs for testing (would be populated from actual data)
const bookIds = [
  'book-1', 'book-2', 'book-3', 'book-4', 'book-5',
  'book-6', 'book-7', 'book-8', 'book-9', 'book-10'
];

/**
 * Get a random book ID for testing
 */
function getRandomBookId(context, events, done) {
  const randomId = bookIds[Math.floor(Math.random() * bookIds.length)];
  context.vars.bookId = randomId;
  return done();
}

/**
 * Generate random user data for registration tests
 */
function generateUserData(context, events, done) {
  context.vars.randomEmail = faker.internet.email();
  context.vars.randomFirstName = faker.name.firstName();
  context.vars.randomLastName = faker.name.lastName();
  context.vars.randomPassword = faker.internet.password(12);
  return done();
}

/**
 * Generate random book data for creation tests
 */
function generateBookData(context, events, done) {
  context.vars.randomTitle = faker.lorem.words(3);
  context.vars.randomISBN = faker.random.alphaNumeric(13);
  context.vars.randomSummary = faker.lorem.paragraph();
  context.vars.randomPageCount = faker.random.number({ min: 100, max: 1000 });
  context.vars.randomPrice = faker.random.number({ min: 10000, max: 50000 });
  return done();
}

/**
 * Log performance metrics
 */
function logMetrics(context, events, done) {
  const startTime = Date.now();
  context.vars.startTime = startTime;
  
  events.on('response', (response) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Response time: ${responseTime}ms, Status: ${response.statusCode}`);
    
    // Log slow responses
    if (responseTime > 1000) {
      console.warn(`SLOW RESPONSE: ${response.url} took ${responseTime}ms`);
    }
  });
  
  return done();
}

/**
 * Custom think time based on operation type
 */
function customThinkTime(context, events, done) {
  const operationType = context.vars.operationType || 'default';
  let thinkTime = 1000; // Default 1 second
  
  switch (operationType) {
    case 'search':
      thinkTime = 500; // Users search quickly
      break;
    case 'read':
      thinkTime = 2000; // Users read content
      break;
    case 'create':
      thinkTime = 5000; // Users take time to create
      break;
  }
  
  setTimeout(() => done(), thinkTime);
}

/**
 * Validate response data
 */
function validateResponse(context, events, done) {
  events.on('response', (response) => {
    if (response.statusCode >= 400) {
      console.error(`Error response: ${response.statusCode} - ${response.body}`);
    }
    
    // Validate JSON structure for API responses
    if (response.headers['content-type']?.includes('application/json')) {
      try {
        const data = JSON.parse(response.body);
        
        // Validate pagination responses
        if (data.data && Array.isArray(data.data)) {
          if (!data.total || !data.page || !data.limit) {
            console.warn('Invalid pagination structure');
          }
        }
      } catch (error) {
        console.error('Invalid JSON response:', error.message);
      }
    }
  });
  
  return done();
}

module.exports = {
  getRandomBookId,
  generateUserData,
  generateBookData,
  logMetrics,
  customThinkTime,
  validateResponse
};