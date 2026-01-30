/**
 * Logger Utility
 * Centralized logging with Winston
 */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerOptions {
  level?: LogLevel;
  console?: boolean;
  file?: boolean;
  filePath?: string;
  timestamps?: boolean;
}

/**
 * Singleton logger class
 */
export class Logger {
  private static instance: Logger;
  private winstonLogger: winston.Logger;
  private options: Required<LoggerOptions>;

  private constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level ?? 'info',
      console: options.console ?? true,
      file: options.file ?? false,
      filePath: options.filePath ?? './logs/framework.log',
      timestamps: options.timestamps ?? true,
    };

    this.winstonLogger = this.createLogger();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Custom format
    const customFormat = winston.format.combine(
      winston.format.errors({ stack: true }),
      this.options.timestamps ? winston.format.timestamp() : winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        const ts = this.options.timestamps ? `[${timestamp as string}] ` : '';
        const stackTrace = stack ? `\n${stack as string}` : '';
        return `${ts}[${level.toUpperCase()}] ${message as string}${stackTrace}`;
      })
    );

    // Console transport
    if (this.options.console && this.options.level !== 'silent') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            customFormat
          ),
        })
      );
    }

    // File transport
    if (this.options.file && this.options.level !== 'silent') {
      const logDir = path.dirname(this.options.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      transports.push(
        new winston.transports.File({
          filename: this.options.filePath,
          format: customFormat,
        })
      );
    }

    return winston.createLogger({
      level: this.options.level === 'silent' ? 'error' : this.options.level,
      silent: this.options.level === 'silent',
      transports,
    });
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    this.winstonLogger.debug(message, meta);
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    this.winstonLogger.info(message, meta);
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    this.winstonLogger.warn(message, meta);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | Record<string, unknown>): void {
    if (error instanceof Error) {
      this.winstonLogger.error(message, { stack: error.stack });
    } else {
      this.winstonLogger.error(message, error);
    }
  }

  /**
   * Log action with context
   */
  public action(action: string, details: Record<string, unknown>): void {
    this.info(`[ACTION] ${action}`, details);
  }

  /**
   * Log step in workflow
   */
  public step(stepNumber: number, description: string): void {
    this.info(`[STEP ${stepNumber}] ${description}`);
  }

  /**
   * Configure logger options
   */
  public configure(options: LoggerOptions): void {
    this.options = { ...this.options, ...options };
    this.winstonLogger = this.createLogger();
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.options.level = level;
    this.winstonLogger = this.createLogger();
  }

  /**
   * Create a child logger with additional context
   */
  public child(context: Record<string, unknown>): winston.Logger {
    return this.winstonLogger.child(context);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
