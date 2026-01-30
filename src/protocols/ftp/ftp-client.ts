/**
 * FTP Client
 * Wrapper for FTP operations with error handling and logging
 */

import { Client, AccessOptions, FileInfo } from 'basic-ftp';
import { FrameworkConfig } from '../../core/config';
import {
  FtpConnectionException,
  FtpFileOperationException,
  FtpAuthenticationException,
} from '../../core/exceptions';
import { Logger } from '../../utils/logger';
import { retry, RetryOptions } from '../../utils/retry.utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FTP Client Options
 */
export interface FtpClientOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  secure?: boolean;
  timeout?: number;
  retries?: number;
  enableLogging?: boolean;
}

/**
 * FTP File Info
 */
export interface FtpFileInfo {
  name: string;
  type: 'file' | 'directory' | 'symbolic-link' | 'unknown';
  size: number;
  modifiedAt?: Date;
  permissions?: string;
  path: string;
}

/**
 * FTP Transfer Progress
 */
export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

/**
 * FTP Client wrapper
 */
export class FtpClient {
  private client: Client;
  private logger: Logger;
  private options: Required<FtpClientOptions>;
  private connected: boolean = false;
  private currentDirectory: string = '/';

  constructor(options: FtpClientOptions = {}) {
    this.client = new Client();
    this.logger = Logger.getInstance();

    const ftpConfig = FrameworkConfig.getFtp();
    const timeouts = FrameworkConfig.getTimeouts();
    const retries = FrameworkConfig.getRetries();

    this.options = {
      host: options.host ?? ftpConfig.host,
      port: options.port ?? ftpConfig.port,
      username: options.username ?? ftpConfig.username,
      password: options.password ?? ftpConfig.password,
      secure: options.secure ?? ftpConfig.secure,
      timeout: options.timeout ?? timeouts.ftp,
      retries: options.retries ?? retries.ftpOperation,
      enableLogging: options.enableLogging ?? true,
    };

    // Note: basic-ftp timeout is set during connection
  }

  /**
   * Connect to FTP server
   */
  public async connect(): Promise<this> {
    if (this.connected) {
      return this;
    }

    this.logAction('Connecting to FTP server', {
      host: this.options.host,
      port: this.options.port,
    });

    try {
      const accessOptions: AccessOptions = {
        host: this.options.host,
        port: this.options.port,
        user: this.options.username,
        password: this.options.password,
        secure: this.options.secure,
      };

      await this.client.access(accessOptions);
      this.connected = true;
      this.currentDirectory = await this.client.pwd();

      this.logger.info(`Connected to FTP server: ${this.options.host}`);
    } catch (error) {
      const err = error as Error;
      
      if (err.message.includes('authentication') || err.message.includes('login')) {
        throw new FtpAuthenticationException(
          this.options.host,
          this.options.username
        );
      }

      throw new FtpConnectionException(
        this.options.host,
        this.options.port,
        err.message
      );
    }

    return this;
  }

  /**
   * Disconnect from FTP server
   */
  public async disconnect(): Promise<void> {
    if (this.connected) {
      this.logAction('Disconnecting from FTP server');
      this.client.close();
      this.connected = false;
      this.logger.info('Disconnected from FTP server');
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure connected before operation
   */
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  /**
   * Upload file to FTP server
   */
  public async uploadFile(
    localPath: string,
    remotePath: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<this> {
    await this.ensureConnected();

    if (!fs.existsSync(localPath)) {
      throw new FtpFileOperationException('upload', localPath, 'Local file not found');
    }

    this.logAction('Uploading file', { localPath, remotePath });

    const retryOptions: Partial<RetryOptions> = {
      maxAttempts: this.options.retries,
      onRetry: (attempt, error) => {
        this.logger.warn(`Upload retry ${attempt}: ${error.message}`);
      },
    };

    try {
      await retry(async () => {
        if (onProgress) {
          const stats = fs.statSync(localPath);
          this.client.trackProgress((info) => {
            onProgress({
              bytesTransferred: info.bytes,
              totalBytes: stats.size,
              percentage: Math.round((info.bytes / stats.size) * 100),
            });
          });
        }

        await this.client.uploadFrom(localPath, remotePath);
        this.client.trackProgress();
      }, retryOptions);

      this.logger.info(`File uploaded: ${localPath} -> ${remotePath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'upload',
        localPath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Download file from FTP server
   */
  public async downloadFile(
    remotePath: string,
    localPath: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<this> {
    await this.ensureConnected();

    this.logAction('Downloading file', { remotePath, localPath });

    // Ensure local directory exists
    const localDir = path.dirname(localPath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const retryOptions: Partial<RetryOptions> = {
      maxAttempts: this.options.retries,
      onRetry: (attempt, error) => {
        this.logger.warn(`Download retry ${attempt}: ${error.message}`);
      },
    };

    try {
      await retry(async () => {
        if (onProgress) {
          const fileInfo = await this.getFileInfo(remotePath);
          if (fileInfo) {
            this.client.trackProgress((info) => {
              onProgress({
                bytesTransferred: info.bytes,
                totalBytes: fileInfo.size,
                percentage: Math.round((info.bytes / fileInfo.size) * 100),
              });
            });
          }
        }

        await this.client.downloadTo(localPath, remotePath);
        this.client.trackProgress();
      }, retryOptions);

      this.logger.info(`File downloaded: ${remotePath} -> ${localPath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'download',
        remotePath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Delete file on FTP server
   */
  public async deleteFile(remotePath: string): Promise<this> {
    await this.ensureConnected();

    this.logAction('Deleting file', { remotePath });

    try {
      await this.client.remove(remotePath);
      this.logger.info(`File deleted: ${remotePath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'delete',
        remotePath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * List files in directory
   */
  public async listFiles(remotePath: string = '.'): Promise<FtpFileInfo[]> {
    await this.ensureConnected();

    this.logAction('Listing files', { remotePath });

    try {
      const list = await this.client.list(remotePath);
      return list.map((item) => this.mapFileInfo(item, remotePath));
    } catch (error) {
      throw new FtpFileOperationException(
        'list',
        remotePath,
        (error as Error).message
      );
    }
  }

  /**
   * Check if file exists
   */
  public async fileExists(remotePath: string): Promise<boolean> {
    await this.ensureConnected();

    try {
      const dir = path.dirname(remotePath);
      const fileName = path.basename(remotePath);
      const list = await this.client.list(dir);
      return list.some((item) => item.name === fileName);
    } catch {
      return false;
    }
  }

  /**
   * Get file info
   */
  public async getFileInfo(remotePath: string): Promise<FtpFileInfo | null> {
    await this.ensureConnected();

    try {
      const dir = path.dirname(remotePath);
      const fileName = path.basename(remotePath);
      const list = await this.client.list(dir);
      const item = list.find((f) => f.name === fileName);

      if (item) {
        return this.mapFileInfo(item, dir);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create directory
   */
  public async createDirectory(remotePath: string): Promise<this> {
    await this.ensureConnected();

    this.logAction('Creating directory', { remotePath });

    try {
      await this.client.ensureDir(remotePath);
      this.logger.info(`Directory created: ${remotePath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'list',
        remotePath,
        `Failed to create directory: ${(error as Error).message}`
      );
    }

    return this;
  }

  /**
   * Delete directory
   */
  public async deleteDirectory(remotePath: string): Promise<this> {
    await this.ensureConnected();

    this.logAction('Deleting directory', { remotePath });

    try {
      await this.client.removeDir(remotePath);
      this.logger.info(`Directory deleted: ${remotePath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'delete',
        remotePath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Change current directory
   */
  public async changeDirectory(remotePath: string): Promise<this> {
    await this.ensureConnected();

    this.logAction('Changing directory', { remotePath });

    try {
      await this.client.cd(remotePath);
      this.currentDirectory = await this.client.pwd();
    } catch (error) {
      throw new FtpFileOperationException(
        'list',
        remotePath,
        `Failed to change directory: ${(error as Error).message}`
      );
    }

    return this;
  }

  /**
   * Get current directory
   */
  public async getCurrentDirectory(): Promise<string> {
    await this.ensureConnected();
    this.currentDirectory = await this.client.pwd();
    return this.currentDirectory;
  }

  /**
   * Rename file or directory
   */
  public async rename(oldPath: string, newPath: string): Promise<this> {
    await this.ensureConnected();

    this.logAction('Renaming', { oldPath, newPath });

    try {
      await this.client.rename(oldPath, newPath);
      this.logger.info(`Renamed: ${oldPath} -> ${newPath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'rename',
        oldPath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Upload directory recursively
   */
  public async uploadDirectory(
    localPath: string,
    remotePath: string
  ): Promise<this> {
    await this.ensureConnected();

    this.logAction('Uploading directory', { localPath, remotePath });

    try {
      await this.client.uploadFromDir(localPath, remotePath);
      this.logger.info(`Directory uploaded: ${localPath} -> ${remotePath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'upload',
        localPath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Download directory recursively
   */
  public async downloadDirectory(
    remotePath: string,
    localPath: string
  ): Promise<this> {
    await this.ensureConnected();

    this.logAction('Downloading directory', { remotePath, localPath });

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }

    try {
      await this.client.downloadToDir(localPath, remotePath);
      this.logger.info(`Directory downloaded: ${remotePath} -> ${localPath}`);
    } catch (error) {
      throw new FtpFileOperationException(
        'download',
        remotePath,
        (error as Error).message
      );
    }

    return this;
  }

  /**
   * Get file size
   */
  public async getFileSize(remotePath: string): Promise<number> {
    await this.ensureConnected();

    try {
      return await this.client.size(remotePath);
    } catch (error) {
      throw new FtpFileOperationException(
        'list',
        remotePath,
        `Failed to get file size: ${(error as Error).message}`
      );
    }
  }

  /**
   * Map FileInfo to FtpFileInfo
   */
  private mapFileInfo(item: FileInfo, directory: string): FtpFileInfo {
    let type: FtpFileInfo['type'] = 'unknown';
    if (item.isDirectory) type = 'directory';
    else if (item.isFile) type = 'file';
    else if (item.isSymbolicLink) type = 'symbolic-link';

    return {
      name: item.name,
      type,
      size: item.size,
      modifiedAt: item.modifiedAt,
      permissions: item.permissions?.toString(),
      path: path.join(directory, item.name),
    };
  }

  /**
   * Log FTP action
   */
  private logAction(action: string, details?: Record<string, unknown>): void {
    if (this.options.enableLogging) {
      this.logger.action(`FTP: ${action}`, details ?? {});
    }
  }
}

/**
 * Factory function for creating FTP client
 */
export function createFtpClient(options?: FtpClientOptions): FtpClient {
  return new FtpClient(options);
}
