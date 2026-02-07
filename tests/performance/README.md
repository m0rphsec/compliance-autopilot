# Performance Benchmarks

Comprehensive performance testing suite for Compliance Autopilot.

## Quick Start

Run all performance benchmarks:

```bash
cd tests/performance
./run-benchmarks.sh
```

Or using npm:

```bash
npm test -- tests/performance/benchmark.test.ts
```

## What Gets Tested

### Repository Size Benchmarks

1. **Small Repository** (<100 files)
   - Target: <30 seconds
   - Files: ~50
   - Memory: <200MB

2. **Medium Repository** (<500 files)
   - Target: <60 seconds
   - Files: ~300
   - Memory: <500MB

3. **Large Repository** (<5000 files)
   - Target: <180 seconds
   - Files: ~1000+
   - Memory: <1000MB

### Performance Metrics

Each benchmark measures:

- **Execution Time** - Total analysis duration
- **Memory Usage** - Peak and average memory consumption
- **API Call Count** - Number of API requests
- **Parallel Efficiency** - Speedup from parallelization
- **Cache Hit Rate** - Percentage of cached operations

## Components

### benchmark.test.ts

Main benchmark suite that:
- Creates test fixtures of various sizes
- Runs performance tests
- Measures execution time and memory
- Tests parallel processing efficiency
- Generates performance report

### memory-profiler.ts

Memory profiling utility that:
- Tracks heap usage over time
- Records peak memory consumption
- Calculates average memory usage
- Exports memory profiles to CSV
- Provides memory analysis

### api-call-tracker.ts

API monitoring utility that:
- Tracks all API requests
- Measures response times
- Monitors cache efficiency
- Detects slow endpoints
- Provides optimization recommendations

### run-benchmarks.sh

Benchmark runner script that:
- Sets up environment variables
- Enables garbage collection
- Runs Jest with appropriate settings
- Generates performance report
- Displays summary

## Running Benchmarks

### Full Benchmark Suite

```bash
./run-benchmarks.sh
```

### Individual Tests

```bash
# Test small repository only
npm test -- tests/performance/benchmark.test.ts -t "Small repository"

# Test memory usage
npm test -- tests/performance/benchmark.test.ts -t "Memory usage"

# Test parallel processing
npm test -- tests/performance/benchmark.test.ts -t "Parallel processing"
```

### With Memory Profiling

```bash
NODE_OPTIONS="--expose-gc --max-old-space-size=4096" \
npm test -- tests/performance/benchmark.test.ts --logHeapUsage
```

### With Coverage

```bash
npm test -- tests/performance/benchmark.test.ts --coverage
```

## Output

### Console Output

The benchmark runner displays:
- Test progress and status
- Real-time metrics for each benchmark
- Memory usage information
- Pass/fail status for each test
- Summary of results

### Performance Report

A detailed markdown report is generated at:
```
docs/PERFORMANCE_BENCHMARK.md
```

The report includes:
- Executive summary
- Detailed results table
- Analysis and recommendations
- Optimization suggestions
- Historical comparisons

## Understanding Results

### Execution Time

- Should scale **sub-linearly** with file count
- Linear scaling indicates poor parallelization
- Super-linear scaling suggests caching benefits

### Memory Usage

- Should be proportional to **batch size**, not total files
- Growing memory indicates memory leaks
- Steady memory suggests good management

### API Call Count

- Should scale with **unique resources**, not file count
- High API calls suggest missing caching
- Review API call tracker recommendations

### Parallel Efficiency

- **1.0x** - No parallelization benefit
- **2.0x** - Good parallelization
- **3.0x+** - Excellent parallelization
- **<1.0x** - Overhead exceeds benefits

## Performance Targets

| Metric | Small | Medium | Large |
|--------|-------|--------|-------|
| Time | <30s | <60s | <180s |
| Memory | <200MB | <500MB | <1000MB |
| API Calls | <10 | <30 | <100 |
| Efficiency | >2.0x | >2.5x | >3.0x |

## Optimization Tips

### Improving Execution Time

1. **Increase Parallelization**
   - Use more worker threads
   - Optimize task distribution
   - Reduce synchronization overhead

2. **Implement Caching**
   - Cache parsed files
   - Cache API responses
   - Use incremental analysis

3. **Optimize Algorithms**
   - Profile hot paths
   - Use efficient data structures
   - Reduce redundant operations

### Reducing Memory Usage

1. **Stream Processing**
   - Process files incrementally
   - Avoid loading entire repo
   - Clear intermediate results

2. **Garbage Collection**
   - Trigger GC between batches
   - Use weak references for caches
   - Avoid memory leaks

3. **Batch Size Tuning**
   - Balance parallelism vs memory
   - Adjust based on file sizes
   - Monitor memory pressure

### Optimizing API Calls

1. **Batching**
   - Combine related requests
   - Use batch APIs when available
   - Implement request coalescing

2. **Caching**
   - Cache static data
   - Use conditional requests
   - Implement cache invalidation

3. **Rate Limiting**
   - Respect API limits
   - Implement backoff strategies
   - Use request queues

## Troubleshooting

### Tests Timing Out

Increase Jest timeout:
```bash
npm test -- tests/performance/benchmark.test.ts --testTimeout=600000
```

### Out of Memory

Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm test
```

### Inconsistent Results

Run multiple times and check for:
- Background processes consuming resources
- Network latency variations
- File system cache effects
- Garbage collection timing

## CI/CD Integration

Add to GitHub Actions:

```yaml
name: Performance

on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: cd tests/performance && ./run-benchmarks.sh
      - uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: docs/PERFORMANCE_BENCHMARK.md
```

## Contributing

When adding new benchmarks:

1. Follow existing test structure
2. Use meaningful test names
3. Set appropriate timeouts
4. Document expected results
5. Update this README

## Tools

Useful profiling tools:

- **Node.js Profiler**: `node --prof`
- **Chrome DevTools**: `node --inspect`
- **Clinic.js**: `clinic doctor`
- **0x**: Flamegraph generation
- **Heap Snapshot**: Chrome DevTools

## Further Reading

- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [V8 Performance](https://v8.dev/docs/profile)
- [Jest Performance](https://jestjs.io/docs/troubleshooting#tests-are-extremely-slow-on-docker)
- [Memory Profiling](https://nodejs.org/en/docs/guides/diagnostics/memory/)

---

For questions or issues, see the main project [CONTRIBUTING.md](../../CONTRIBUTING.md)
