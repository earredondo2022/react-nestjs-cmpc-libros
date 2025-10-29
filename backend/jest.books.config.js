module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ['**/books/**/*.spec.ts'],
  collectCoverageFrom: [
    'books/**/*.{ts,js}',
    '!books/**/*.spec.ts',
    '!books/**/*.interface.ts',
    '!books/**/*.dto.ts'
  ],
  coverageDirectory: '../coverage-books',
  coverageReporters: ['text', 'html'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverage: true,
  verbose: false,
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 65,
      lines: 70
    }
  }
};