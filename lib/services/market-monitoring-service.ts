import { EventEmitter } from 'events';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  timestamp: number;
  errorCount: number;
}

interface DataQualityMetrics {
  service: string;
  completeness: number;
  accuracy: number;
  timeliness: number;
  timestamp: number;
}

class MarketMonitoringService extends EventEmitter {
  private static instance: MarketMonitoringService;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private dataQualityMetrics: Map<string, DataQualityMetrics> = new Map();
  private errorCounts: Map<string, number> = new Map();
  
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly ERROR_THRESHOLD = 5; // Number of errors before marking service as degraded
  private readonly LATENCY_THRESHOLD = 2000; // 2 seconds
  
  private constructor() {
    super();
    this.startMonitoring();
  }
  
  public static getInstance(): MarketMonitoringService {
    if (!MarketMonitoringService.instance) {
      MarketMonitoringService.instance = new MarketMonitoringService();
    }
    return MarketMonitoringService.instance;
  }
  
  /**
   * Start monitoring services
   */
  private startMonitoring() {
    setInterval(() => {
      this.checkServicesHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }
  
  /**
   * Record API call result
   */
  public recordApiCall(service: string, startTime: number, success: boolean, data?: any) {
    const latency = Date.now() - startTime;
    const currentErrors = this.errorCounts.get(service) || 0;
    
    if (!success) {
      this.errorCounts.set(service, currentErrors + 1);
      this.emit('apiError', { service, latency, timestamp: Date.now() });
    }
    
    // Update health check
    const status = this.determineServiceStatus(service, latency, currentErrors);
    this.healthChecks.set(service, {
      service,
      status,
      latency,
      timestamp: Date.now(),
      errorCount: currentErrors
    });
    
    // Update data quality metrics if data is provided
    if (data) {
      this.updateDataQualityMetrics(service, data);
    }
    
    // Emit events for monitoring
    this.emit('apiCall', { service, latency, success, timestamp: Date.now() });
  }
  
  /**
   * Determine service status based on metrics
   */
  private determineServiceStatus(
    service: string,
    latency: number,
    errorCount: number
  ): 'healthy' | 'degraded' | 'down' {
    if (errorCount >= this.ERROR_THRESHOLD * 2) return 'down';
    if (errorCount >= this.ERROR_THRESHOLD || latency > this.LATENCY_THRESHOLD) return 'degraded';
    return 'healthy';
  }
  
  /**
   * Update data quality metrics
   */
  private updateDataQualityMetrics(service: string, data: any) {
    const metrics = {
      service,
      completeness: this.calculateCompleteness(data),
      accuracy: this.calculateAccuracy(data),
      timeliness: this.calculateTimeliness(data),
      timestamp: Date.now()
    };
    
    this.dataQualityMetrics.set(service, metrics);
    this.emit('dataQuality', metrics);
  }
  
  /**
   * Calculate data completeness (0-1)
   */
  public calculateCompleteness(data: any): number {
    if (!data) return 0;
    
    const requiredFields = ['price', 'volume', 'marketCap', 'change24h'];
    let validFields = 0;
    
    for (const field of requiredFields) {
      if (data[field] !== undefined && data[field] !== null) validFields++;
    }
    
    return validFields / requiredFields.length;
  }
  
  /**
   * Calculate data accuracy (0-1)
   */
  public calculateAccuracy(data: any): number {
    if (!data) return 0;
    
    let validValues = 0;
    let totalValues = 0;
    
    const validateValue = (value: any) => {
      if (typeof value !== 'number') return false;
      if (isNaN(value)) return false;
      if (!isFinite(value)) return false;
      return true;
    };
    
    for (const key in data) {
      if (typeof data[key] === 'number') {
        totalValues++;
        if (validateValue(data[key])) validValues++;
      }
    }
    
    return totalValues > 0 ? validValues / totalValues : 0;
  }
  
  /**
   * Calculate data timeliness (0-1)
   */
  public calculateTimeliness(data: any): number {
    if (!data || !data.timestamp) return 0;
    
    const age = Date.now() - new Date(data.timestamp).getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    return Math.max(0, 1 - (age / maxAge));
  }
  
  /**
   * Get current health status for all services
   */
  public getServicesHealth(): Map<string, HealthCheck> {
    return new Map(this.healthChecks);
  }
  
  /**
   * Get current data quality metrics for all services
   */
  public getDataQualityMetrics(): Map<string, DataQualityMetrics> {
    return new Map(this.dataQualityMetrics);
  }
  
  /**
   * Check if a service is healthy
   */
  public isServiceHealthy(service: string): boolean {
    const health = this.healthChecks.get(service);
    return health ? health.status === 'healthy' : false;
  }
  
  /**
   * Reset error count for a service
   */
  public resetErrorCount(service: string) {
    this.errorCounts.set(service, 0);
    const health = this.healthChecks.get(service);
    if (health) {
      health.errorCount = 0;
      health.status = this.determineServiceStatus(service, health.latency, 0);
      this.healthChecks.set(service, health);
    }
  }
  
  /**
   * Check health of all services
   */
  private async checkServicesHealth() {
    for (const [service, health] of this.healthChecks) {
      // Emit warning if service is not healthy
      if (health.status !== 'healthy') {
        this.emit('serviceUnhealthy', {
          service,
          status: health.status,
          errorCount: health.errorCount,
          timestamp: Date.now()
        });
      }
      
      // Reset error count if service has been healthy for a while
      if (health.errorCount > 0 && 
          Date.now() - health.timestamp > this.HEALTH_CHECK_INTERVAL * 2) {
        this.resetErrorCount(service);
      }
    }
  }
}

// Export singleton instance
export const marketMonitoring = MarketMonitoringService.getInstance(); 