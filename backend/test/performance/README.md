# Performance Testing Documentation

This directory contains performance and load testing configurations for the CMPC-libros backend API.

## Tools Used

- **Artillery**: HTTP load testing and benchmarking tool
- **Custom Processor**: JavaScript functions for dynamic data generation and validation

## Files

- `load-test.yml`: Main Artillery configuration with test scenarios
- `processor.js`: Custom functions for data generation and response validation

## Test Scenarios

### 1. Authentication Flow (30% weight)
- User login with JWT token generation
- Profile access with authentication
- Tests JWT token validation performance

### 2. Books API Performance (50% weight)
- Complete CRUD operations for books
- Pagination and search functionality
- Random book access patterns
- Covers most common user interactions

### 3. Heavy Database Operations (20% weight)
- CSV export functionality
- Complex search queries with filters
- Database-intensive operations

## Load Testing Phases

1. **Warm-up** (30s, 1 req/s): Initialize system
2. **Ramp-up** (60s, 5→20 req/s): Gradual load increase
3. **Sustained Load** (120s, 20 req/s): Normal operation simulation
4. **Peak Load** (60s, 50 req/s): High traffic simulation
5. **Cool-down** (30s, 5 req/s): System recovery

## Performance Thresholds

- **P95 Response Time**: < 1000ms
- **P99 Response Time**: < 2000ms
- **Maximum Error Rate**: < 1%

## Running Performance Tests

### Prerequisites

1. Ensure the backend server is running:
   ```bash
   npm run start:dev
   ```

2. Install Artillery globally:
   ```bash
   npm install -g artillery
   ```

### Basic Load Test

```bash
npm run test:perf
```

Or directly with Artillery:

```bash
artillery run test/performance/load-test.yml
```

### Generate HTML Report

```bash
artillery run test/performance/load-test.yml --output report.json
artillery report report.json
```

### Custom Test Duration

```bash
artillery run test/performance/load-test.yml --config '{"phases":[{"duration":60,"arrivalRate":10}]}'
```

## Interpreting Results

### Key Metrics to Monitor

- **Response Time Percentiles** (p50, p95, p99)
- **Request Rate** (requests per second)
- **Error Rate** (percentage of failed requests)
- **Throughput** (successful requests per second)

### Success Criteria

✅ **Good Performance**:
- P95 < 500ms
- P99 < 1000ms
- Error rate < 0.1%

⚠️ **Acceptable Performance**:
- P95 < 1000ms
- P99 < 2000ms
- Error rate < 1%

❌ **Poor Performance**:
- P95 > 1000ms
- P99 > 2000ms
- Error rate > 1%

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure backend server is running on port 3001
2. **Authentication Failures**: Check if test user exists in database
3. **High Error Rates**: Monitor server logs for application errors
4. **Slow Response Times**: Check database connections and queries

### Debugging

1. Enable verbose logging:
   ```bash
   artillery run test/performance/load-test.yml --verbose
   ```

2. Check server logs during test execution
3. Monitor database performance and connection pools
4. Use application performance monitoring tools

## Customization

### Adding New Scenarios

1. Add scenario to `load-test.yml`:
   ```yaml
   scenarios:
     - name: "My Custom Test"
       weight: 10
       flow:
         - get:
             url: "/my-endpoint"
   ```

2. Add custom functions to `processor.js` if needed

### Modifying Load Patterns

Update the `phases` section in `load-test.yml`:

```yaml
phases:
  - duration: 120
    arrivalRate: 25
    name: "Custom load pattern"
```

### Environment-Specific Testing

Create environment-specific configuration files:

- `load-test-staging.yml`
- `load-test-production.yml`

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Performance Tests
  run: |
    npm run start:prod &
    sleep 10
    npm run test:perf
    pkill -f "node dist/main"
```

### Performance Regression Detection

Set up automated alerts for:
- Response time degradation > 20%
- Error rate increase > 0.5%
- Throughput decrease > 15%

## Best Practices

1. **Test Environment**: Use dedicated test environment for performance testing
2. **Data Consistency**: Use consistent test data across runs
3. **Baseline Metrics**: Establish performance baselines for comparison
4. **Regular Testing**: Run performance tests on every major release
5. **Load Patterns**: Test realistic user behavior patterns
6. **Resource Monitoring**: Monitor CPU, memory, and database during tests