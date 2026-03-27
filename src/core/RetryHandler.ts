import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors: RegExp[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
}

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      backoffFactor: config.backoffFactor ?? 2,
      retryableErrors: config.retryableErrors ?? [
        /timeout/i,
        /network/i,
        /connection/i,
        /5\d{2}/, // 5xx HTTP errors
        /rate limit/i,
        /too many requests/i,
      ],
    };
  }

  /**
   * Execute with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          logger.info('Retrying operation', {
            operation: operationName,
            attempt,
            maxRetries: this.config.maxRetries,
            delayMs: delay,
          });
          await this.sleep(delay);
        }

        return await operation();
      } catch (error: any) {
        lastError = error;

        const shouldRetry = this.shouldRetry(error, attempt);

        if (!shouldRetry) {
          if (operationName) {
            logger.error('Operation failed, not retrying', {
              operation: operationName,
              attempt,
              maxRetries: this.config.maxRetries,
              error: error.message,
            });
          }
          break;
        }

        if (attempt === this.config.maxRetries) {
          logger.error('Operation failed after all retries', {
            operation: operationName,
            attempts: attempt + 1,
            maxRetries: this.config.maxRetries,
            error: error.message,
          });
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    const errorMessage = (error.message || error.toString()).toLowerCase();

    // Check if error matches retryable patterns
    const isRetryable = this.config.retryableErrors.some(pattern => pattern.test(errorMessage));

    // Don't retry client errors (4xx) except rate limiting
    if (error.response?.status >= 400 && error.response.status < 500) {
      return false;
    }

    return isRetryable;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(this.config.backoffFactor, attempt - 1);

    // Add jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);

    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap a function with retry logic
   */
  wrap<T>(operation: () => Promise<T>, operationName?: string): () => Promise<T> {
    return () => this.withRetry(operation, operationName);
  }
}

/**
 * Circuit Breaker pattern implementation
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeoutMs: config.resetTimeoutMs ?? 60000,
      monitoringPeriodMs: config.monitoringPeriodMs ?? 10000,
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
        logger.info('Circuit breaker entering half-open state', { operation: operationName });
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker is OPEN. Operation ${operationName} rejected.`);
      }
    }

    try {
      const result = await operation();

      // Success - reset failures
      if (this.state === 'half-open') {
        logger.info('Circuit breaker resetting to closed', { operation: operationName });
      }
      this.reset();

      return result;
    } catch (error) {
      this.recordFailure();

      if (this.state === 'half-open' || this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        this.lastFailureTime = Date.now();
        logger.error('Circuit breaker opened', {
          operation: operationName,
          failures: this.failures,
        });
      }

      throw error;
    }
  }

  /**
   * Record a failure
   */
  private recordFailure(): void {
    this.failures++;

    // Clean up old failures (outside monitoring window)
    const now = Date.now();
    if (now - this.lastFailureTime > this.config.monitoringPeriodMs) {
      this.failures = Math.min(this.failures, 1);
    }
    this.lastFailureTime = now;
  }

  /**
   * Reset circuit breaker
   */
  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  /**
   * Check if circuit is allowing requests
   */
  isAllowRequest(): boolean {
    return this.state !== 'open';
  }
}

/**
 * Combined retry + circuit breaker wrapper
 */
export class ResilientExecutor {
  private retryHandler: RetryHandler;
  private circuitBreaker: CircuitBreaker;

  constructor(
    retryConfig?: Partial<RetryConfig>,
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>
  ) {
    this.retryHandler = new RetryHandler(retryConfig);
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> {
    return this.circuitBreaker.execute(
      () => this.retryHandler.withRetry(operation, operationName),
      operationName
    );
  }

  getCircuitBreakerState(): 'closed' | 'open' | 'half-open' {
    return this.circuitBreaker.getState();
  }

  isHealthy(): boolean {
    return this.circuitBreaker.isAllowRequest();
  }
}
