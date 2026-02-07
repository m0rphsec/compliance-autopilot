/**
 * Memory Profiler for Performance Analysis
 *
 * Tracks memory usage during benchmark execution
 */

export interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
}

export interface MemoryReport {
  samples: MemoryProfile[];
  peakMemory: MemoryProfile;
  averageHeapUsed: number;
  averageRSS: number;
  duration: number;
}

export class MemoryProfiler {
  private samples: MemoryProfile[] = [];
  private startTime: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private sampleIntervalMs: number;

  constructor(sampleIntervalMs: number = 100) {
    this.sampleIntervalMs = sampleIntervalMs;
  }

  /**
   * Start memory profiling
   */
  public start(): void {
    this.startTime = Date.now();
    this.samples = [];

    // Take initial sample
    this.takeSample();

    // Start periodic sampling
    this.intervalId = setInterval(() => {
      this.takeSample();
    }, this.sampleIntervalMs);
  }

  /**
   * Stop memory profiling and return report
   */
  public stop(): MemoryReport {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Take final sample
    this.takeSample();

    return this.generateReport();
  }

  /**
   * Take a memory sample
   */
  private takeSample(): void {
    const mem = process.memoryUsage();

    this.samples.push({
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
    });
  }

  /**
   * Generate memory report
   */
  private generateReport(): MemoryReport {
    if (this.samples.length === 0) {
      throw new Error('No memory samples collected');
    }

    const peakMemory = this.samples.reduce((peak, sample) => {
      return sample.heapUsed > peak.heapUsed ? sample : peak;
    }, this.samples[0]);

    const totalHeapUsed = this.samples.reduce((sum, s) => sum + s.heapUsed, 0);
    const totalRSS = this.samples.reduce((sum, s) => sum + s.rss, 0);

    return {
      samples: this.samples,
      peakMemory,
      averageHeapUsed: totalHeapUsed / this.samples.length,
      averageRSS: totalRSS / this.samples.length,
      duration: Date.now() - this.startTime,
    };
  }

  /**
   * Format memory report as string
   */
  public static formatReport(report: MemoryReport): string {
    const lines: string[] = [];

    lines.push('### Memory Profile');
    lines.push('');
    lines.push(`- **Duration:** ${report.duration}ms`);
    lines.push(`- **Samples:** ${report.samples.length}`);
    lines.push(`- **Peak Heap:** ${(report.peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`- **Average Heap:** ${(report.averageHeapUsed / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`- **Peak RSS:** ${(report.peakMemory.rss / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`- **Average RSS:** ${(report.averageRSS / 1024 / 1024).toFixed(2)}MB`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Export samples to CSV
   */
  public static exportToCSV(report: MemoryReport): string {
    const lines: string[] = [];

    lines.push('timestamp,heapUsed,heapTotal,external,arrayBuffers,rss');

    for (const sample of report.samples) {
      lines.push(
        `${sample.timestamp},${sample.heapUsed},${sample.heapTotal},${sample.external},${sample.arrayBuffers},${sample.rss}`
      );
    }

    return lines.join('\n');
  }
}

/**
 * Helper function to run code with memory profiling
 */
export async function profileMemory<T>(
  fn: () => Promise<T>,
  sampleIntervalMs: number = 100
): Promise<{ result: T; report: MemoryReport }> {
  const profiler = new MemoryProfiler(sampleIntervalMs);

  profiler.start();

  try {
    const result = await fn();
    const report = profiler.stop();

    return { result, report };
  } catch (error) {
    profiler.stop();
    throw error;
  }
}
