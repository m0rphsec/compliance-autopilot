/**
 * API Call Tracker for Performance Analysis
 *
 * Monitors and reports on API call patterns
 */

export interface APICallRecord {
  timestamp: number;
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
}

export interface APICallStats {
  totalCalls: number;
  cachedCalls: number;
  uniqueEndpoints: number;
  averageDuration: number;
  slowestCall: APICallRecord | null;
  callsByEndpoint: Map<string, number>;
  callsByStatus: Map<number, number>;
}

export class APICallTracker {
  private calls: APICallRecord[] = [];
  private enabled: boolean = false;

  /**
   * Start tracking API calls
   */
  public start(): void {
    this.enabled = true;
    this.calls = [];
  }

  /**
   * Stop tracking API calls
   */
  public stop(): void {
    this.enabled = false;
  }

  /**
   * Record an API call
   */
  public record(call: Omit<APICallRecord, 'timestamp'>): void {
    if (!this.enabled) {
      return;
    }

    this.calls.push({
      timestamp: Date.now(),
      ...call,
    });
  }

  /**
   * Get tracked calls
   */
  public getCalls(): APICallRecord[] {
    return [...this.calls];
  }

  /**
   * Generate statistics
   */
  public getStats(): APICallStats {
    const stats: APICallStats = {
      totalCalls: this.calls.length,
      cachedCalls: this.calls.filter(c => c.cached).length,
      uniqueEndpoints: new Set(this.calls.map(c => c.endpoint)).size,
      averageDuration: 0,
      slowestCall: null,
      callsByEndpoint: new Map(),
      callsByStatus: new Map(),
    };

    if (this.calls.length === 0) {
      return stats;
    }

    // Calculate average duration
    const totalDuration = this.calls.reduce((sum, call) => sum + call.duration, 0);
    stats.averageDuration = totalDuration / this.calls.length;

    // Find slowest call
    stats.slowestCall = this.calls.reduce((slowest, call) => {
      return call.duration > (slowest?.duration || 0) ? call : slowest;
    }, this.calls[0]);

    // Count calls by endpoint
    for (const call of this.calls) {
      const count = stats.callsByEndpoint.get(call.endpoint) || 0;
      stats.callsByEndpoint.set(call.endpoint, count + 1);
    }

    // Count calls by status
    for (const call of this.calls) {
      const count = stats.callsByStatus.get(call.status) || 0;
      stats.callsByStatus.set(call.status, count + 1);
    }

    return stats;
  }

  /**
   * Format stats as string
   */
  public formatStats(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push('### API Call Statistics');
    lines.push('');
    lines.push(`- **Total Calls:** ${stats.totalCalls}`);
    lines.push(`- **Cached Calls:** ${stats.cachedCalls} (${((stats.cachedCalls / stats.totalCalls) * 100).toFixed(1)}%)`);
    lines.push(`- **Unique Endpoints:** ${stats.uniqueEndpoints}`);
    lines.push(`- **Average Duration:** ${stats.averageDuration.toFixed(2)}ms`);

    if (stats.slowestCall) {
      lines.push(`- **Slowest Call:** ${stats.slowestCall.endpoint} (${stats.slowestCall.duration}ms)`);
    }

    lines.push('');
    lines.push('#### Calls by Endpoint');
    lines.push('');

    const sortedEndpoints = Array.from(stats.callsByEndpoint.entries())
      .sort((a, b) => b[1] - a[1]);

    for (const [endpoint, count] of sortedEndpoints) {
      lines.push(`- ${endpoint}: ${count} calls`);
    }

    lines.push('');
    lines.push('#### Calls by Status');
    lines.push('');

    const sortedStatuses = Array.from(stats.callsByStatus.entries())
      .sort((a, b) => a[0] - b[0]);

    for (const [status, count] of sortedStatuses) {
      lines.push(`- ${status}: ${count} calls`);
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Export calls to CSV
   */
  public exportToCSV(): string {
    const lines: string[] = [];

    lines.push('timestamp,endpoint,method,duration,status,cached');

    for (const call of this.calls) {
      lines.push(
        `${call.timestamp},"${call.endpoint}",${call.method},${call.duration},${call.status},${call.cached}`
      );
    }

    return lines.join('\n');
  }

  /**
   * Clear tracked calls
   */
  public clear(): void {
    this.calls = [];
  }

  /**
   * Get recommendations based on call patterns
   */
  public getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    // Check cache efficiency
    const cacheRate = stats.cachedCalls / stats.totalCalls;
    if (cacheRate < 0.3 && stats.totalCalls > 10) {
      recommendations.push('Consider implementing caching for frequently accessed endpoints');
    }

    // Check for repeated calls to same endpoint
    for (const [endpoint, count] of stats.callsByEndpoint) {
      if (count > stats.totalCalls * 0.5) {
        recommendations.push(`High call frequency to ${endpoint} - consider batching or caching`);
      }
    }

    // Check for slow calls
    if (stats.slowestCall && stats.slowestCall.duration > 1000) {
      recommendations.push(`Slow API call detected: ${stats.slowestCall.endpoint} (${stats.slowestCall.duration}ms)`);
    }

    // Check error rate
    const errorCalls = Array.from(stats.callsByStatus.entries())
      .filter(([status]) => status >= 400)
      .reduce((sum, [, count]) => sum + count, 0);

    const errorRate = errorCalls / stats.totalCalls;
    if (errorRate > 0.1) {
      recommendations.push(`High error rate: ${(errorRate * 100).toFixed(1)}% - implement retry logic`);
    }

    return recommendations;
  }
}

/**
 * Global API call tracker instance
 */
export const apiCallTracker = new APICallTracker();
