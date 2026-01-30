/**
 * FTP Actions
 * Higher-level FTP action handlers
 */

import { FtpClient, TransferProgress } from './ftp-client';
import { Logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FTP Verification Actions
 */
export class FtpVerificationActions {
  private client: FtpClient;
  private logger: Logger;

  constructor(client: FtpClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Verify file exists on server
   */
  public async verifyFileExists(remotePath: string): Promise<boolean> {
    this.logger.info(`Verifying file exists: ${remotePath}`);
    return await this.client.fileExists(remotePath);
  }

  /**
   * Verify file size matches
   */
  public async verifyFileSize(
    remotePath: string,
    expectedSize: number
  ): Promise<boolean> {
    this.logger.info(`Verifying file size: ${remotePath}`);
    const actualSize = await this.client.getFileSize(remotePath);
    return actualSize === expectedSize;
  }

  /**
   * Verify uploaded file matches local file
   */
  public async verifyUpload(
    localPath: string,
    remotePath: string
  ): Promise<{ success: boolean; reason?: string }> {
    this.logger.info(`Verifying upload: ${localPath} -> ${remotePath}`);

    // Check file exists
    const exists = await this.client.fileExists(remotePath);
    if (!exists) {
      return { success: false, reason: 'Remote file does not exist' };
    }

    // Check file size
    const localStats = fs.statSync(localPath);
    const remoteSize = await this.client.getFileSize(remotePath);
    if (localStats.size !== remoteSize) {
      return {
        success: false,
        reason: `Size mismatch: local=${localStats.size}, remote=${remoteSize}`,
      };
    }

    return { success: true };
  }

  /**
   * Verify downloaded file matches remote file
   */
  public async verifyDownload(
    remotePath: string,
    localPath: string
  ): Promise<{ success: boolean; reason?: string }> {
    this.logger.info(`Verifying download: ${remotePath} -> ${localPath}`);

    // Check local file exists
    if (!fs.existsSync(localPath)) {
      return { success: false, reason: 'Local file does not exist' };
    }

    // Check file size
    const localStats = fs.statSync(localPath);
    const remoteSize = await this.client.getFileSize(remotePath);
    if (localStats.size !== remoteSize) {
      return {
        success: false,
        reason: `Size mismatch: local=${localStats.size}, remote=${remoteSize}`,
      };
    }

    return { success: true };
  }

  /**
   * Verify directory structure
   */
  public async verifyDirectoryStructure(
    remotePath: string,
    expectedFiles: string[]
  ): Promise<{ success: boolean; missing: string[]; extra: string[] }> {
    this.logger.info(`Verifying directory structure: ${remotePath}`);

    const files = await this.client.listFiles(remotePath);
    const actualFiles = files.map((f) => f.name);

    const missing = expectedFiles.filter((f) => !actualFiles.includes(f));
    const extra = actualFiles.filter((f) => !expectedFiles.includes(f));

    return {
      success: missing.length === 0 && extra.length === 0,
      missing,
      extra,
    };
  }

  /**
   * Compare local and remote directories
   */
  public async compareDirectories(
    localPath: string,
    remotePath: string
  ): Promise<{
    matching: string[];
    localOnly: string[];
    remoteOnly: string[];
    sizeMismatch: string[];
  }> {
    this.logger.info(`Comparing directories: ${localPath} <-> ${remotePath}`);

    // Get local files
    const localFiles = fs.readdirSync(localPath);
    const localFileMap = new Map<string, number>();
    for (const file of localFiles) {
      const stats = fs.statSync(path.join(localPath, file));
      if (stats.isFile()) {
        localFileMap.set(file, stats.size);
      }
    }

    // Get remote files
    const remoteFiles = await this.client.listFiles(remotePath);
    const remoteFileMap = new Map<string, number>();
    for (const file of remoteFiles) {
      if (file.type === 'file') {
        remoteFileMap.set(file.name, file.size);
      }
    }

    // Compare
    const matching: string[] = [];
    const localOnly: string[] = [];
    const remoteOnly: string[] = [];
    const sizeMismatch: string[] = [];

    for (const [name, localSize] of localFileMap) {
      if (remoteFileMap.has(name)) {
        const remoteSize = remoteFileMap.get(name)!;
        if (localSize === remoteSize) {
          matching.push(name);
        } else {
          sizeMismatch.push(name);
        }
      } else {
        localOnly.push(name);
      }
    }

    for (const name of remoteFileMap.keys()) {
      if (!localFileMap.has(name)) {
        remoteOnly.push(name);
      }
    }

    return { matching, localOnly, remoteOnly, sizeMismatch };
  }
}

/**
 * FTP Sync Actions
 */
export class FtpSyncActions {
  private client: FtpClient;
  private logger: Logger;

  constructor(client: FtpClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Sync local directory to remote
   */
  public async syncToRemote(
    localPath: string,
    remotePath: string,
    options: {
      deleteExtraRemote?: boolean;
      onProgress?: (file: string, progress: TransferProgress) => void;
    } = {}
  ): Promise<{ uploaded: string[]; deleted: string[]; skipped: string[] }> {
    this.logger.info(`Syncing to remote: ${localPath} -> ${remotePath}`);

    const uploaded: string[] = [];
    const deleted: string[] = [];
    const skipped: string[] = [];

    // Ensure remote directory exists
    await this.client.createDirectory(remotePath);

    // Get local and remote files
    const localFiles = fs.readdirSync(localPath);
    const remoteFiles = await this.client.listFiles(remotePath);
    const remoteFileMap = new Map(remoteFiles.map((f) => [f.name, f]));

    // Upload new/changed files
    for (const file of localFiles) {
      const localFilePath = path.join(localPath, file);
      const remoteFilePath = path.join(remotePath, file);
      const stats = fs.statSync(localFilePath);

      if (stats.isFile()) {
        const remoteFile = remoteFileMap.get(file);
        if (!remoteFile || remoteFile.size !== stats.size) {
          await this.client.uploadFile(localFilePath, remoteFilePath);
          uploaded.push(file);
        } else {
          skipped.push(file);
        }
      }
    }

    // Delete extra remote files if requested
    if (options.deleteExtraRemote) {
      for (const remoteFile of remoteFiles) {
        if (!localFiles.includes(remoteFile.name) && remoteFile.type === 'file') {
          await this.client.deleteFile(path.join(remotePath, remoteFile.name));
          deleted.push(remoteFile.name);
        }
      }
    }

    return { uploaded, deleted, skipped };
  }

  /**
   * Sync remote directory to local
   */
  public async syncToLocal(
    remotePath: string,
    localPath: string,
    options: {
      deleteExtraLocal?: boolean;
      onProgress?: (file: string, progress: TransferProgress) => void;
    } = {}
  ): Promise<{ downloaded: string[]; deleted: string[]; skipped: string[] }> {
    this.logger.info(`Syncing to local: ${remotePath} -> ${localPath}`);

    const downloaded: string[] = [];
    const deleted: string[] = [];
    const skipped: string[] = [];

    // Ensure local directory exists
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }

    // Get local and remote files
    const localFiles = fs.readdirSync(localPath);
    const localFileMap = new Map<string, number>();
    for (const file of localFiles) {
      const stats = fs.statSync(path.join(localPath, file));
      if (stats.isFile()) {
        localFileMap.set(file, stats.size);
      }
    }

    const remoteFiles = await this.client.listFiles(remotePath);

    // Download new/changed files
    for (const remoteFile of remoteFiles) {
      if (remoteFile.type === 'file') {
        const localFilePath = path.join(localPath, remoteFile.name);
        const localSize = localFileMap.get(remoteFile.name);

        if (localSize === undefined || localSize !== remoteFile.size) {
          await this.client.downloadFile(
            path.join(remotePath, remoteFile.name),
            localFilePath
          );
          downloaded.push(remoteFile.name);
        } else {
          skipped.push(remoteFile.name);
        }
      }
    }

    // Delete extra local files if requested
    if (options.deleteExtraLocal) {
      const remoteFileNames = remoteFiles.map((f) => f.name);
      for (const localFile of localFiles) {
        if (!remoteFileNames.includes(localFile)) {
          fs.unlinkSync(path.join(localPath, localFile));
          deleted.push(localFile);
        }
      }
    }

    return { downloaded, deleted, skipped };
  }
}

/**
 * FTP Cleanup Actions
 */
export class FtpCleanupActions {
  private client: FtpClient;
  private logger: Logger;

  constructor(client: FtpClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Delete all files in directory
   */
  public async cleanDirectory(remotePath: string): Promise<string[]> {
    this.logger.info(`Cleaning directory: ${remotePath}`);

    const deleted: string[] = [];
    const files = await this.client.listFiles(remotePath);

    for (const file of files) {
      const filePath = path.join(remotePath, file.name);
      if (file.type === 'file') {
        await this.client.deleteFile(filePath);
        deleted.push(file.name);
      } else if (file.type === 'directory') {
        await this.cleanDirectory(filePath);
        await this.client.deleteDirectory(filePath);
        deleted.push(file.name);
      }
    }

    return deleted;
  }

  /**
   * Delete files older than specified age
   */
  public async deleteOldFiles(
    remotePath: string,
    maxAgeMs: number
  ): Promise<string[]> {
    this.logger.info(`Deleting old files in: ${remotePath}`);

    const deleted: string[] = [];
    const files = await this.client.listFiles(remotePath);
    const now = new Date();

    for (const file of files) {
      if (file.type === 'file' && file.modifiedAt) {
        const age = now.getTime() - file.modifiedAt.getTime();
        if (age > maxAgeMs) {
          await this.client.deleteFile(path.join(remotePath, file.name));
          deleted.push(file.name);
        }
      }
    }

    return deleted;
  }

  /**
   * Delete files matching pattern
   */
  public async deleteByPattern(
    remotePath: string,
    pattern: RegExp
  ): Promise<string[]> {
    this.logger.info(`Deleting files matching pattern: ${pattern}`);

    const deleted: string[] = [];
    const files = await this.client.listFiles(remotePath);

    for (const file of files) {
      if (file.type === 'file' && pattern.test(file.name)) {
        await this.client.deleteFile(path.join(remotePath, file.name));
        deleted.push(file.name);
      }
    }

    return deleted;
  }
}

/**
 * Factory functions
 */
export function createFtpVerificationActions(client: FtpClient): FtpVerificationActions {
  return new FtpVerificationActions(client);
}

export function createFtpSyncActions(client: FtpClient): FtpSyncActions {
  return new FtpSyncActions(client);
}

export function createFtpCleanupActions(client: FtpClient): FtpCleanupActions {
  return new FtpCleanupActions(client);
}
