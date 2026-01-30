/**
 * FTP-related Exceptions
 */

import { FrameworkException } from './framework.exception';

/**
 * Thrown when FTP connection fails
 */
export class FtpConnectionException extends FrameworkException {
  constructor(
    host: string,
    port: number,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Failed to connect to FTP server ${host}:${port}: ${reason}`,
      'FTP_CONNECTION_FAILED',
      {
        host,
        port,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when FTP file operation fails
 */
export class FtpFileOperationException extends FrameworkException {
  constructor(
    operation: 'upload' | 'download' | 'delete' | 'list' | 'rename',
    filePath: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `FTP ${operation} operation failed for "${filePath}": ${reason}`,
      'FTP_FILE_OPERATION_FAILED',
      {
        operation,
        filePath,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when FTP authentication fails
 */
export class FtpAuthenticationException extends FrameworkException {
  constructor(
    host: string,
    username: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `FTP authentication failed for user "${username}" on ${host}`,
      'FTP_AUTH_FAILED',
      {
        host,
        username,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when FTP operation times out
 */
export class FtpTimeoutException extends FrameworkException {
  constructor(
    operation: string,
    timeout: number,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `FTP operation "${operation}" timed out after ${timeout}ms`,
      'FTP_TIMEOUT',
      {
        operation,
        timeout,
        ...additionalInfo,
      }
    );
  }
}
