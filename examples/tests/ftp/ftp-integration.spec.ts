/**
 * Example Tests - FTP Integration
 */

import { test, expect } from '../../fixtures/example-fixtures';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Test Suite: FTP Integration Tests
 * Demonstrates FTP testing capabilities
 */
test.describe('FTP Integration Tests', () => {
  const tempDir = os.tmpdir();
  
  test.beforeEach(async ({ ftpClient }) => {
    // Connect to FTP server
    await ftpClient.connect();
  });

  test.afterEach(async ({ ftpClient }) => {
    // Disconnect after each test
    await ftpClient.disconnect();
  });

  test.describe('File Operations', () => {
    test('Can upload a file to FTP server', async ({ ftpClient }) => {
      // Arrange
      const localFile = path.join(tempDir, 'test-upload.txt');
      fs.writeFileSync(localFile, 'Test content for upload');
      const remotePath = '/uploads/test-upload.txt';

      // Act
      await ftpClient.uploadFile(localFile, remotePath);

      // Assert
      const exists = await ftpClient.fileExists(remotePath);
      expect(exists).toBe(true);

      // Cleanup
      await ftpClient.deleteFile(remotePath);
      fs.unlinkSync(localFile);
    });

    test('Can download a file from FTP server', async ({ ftpClient }) => {
      // Arrange
      const localUpload = path.join(tempDir, 'test-download-source.txt');
      const localDownload = path.join(tempDir, 'test-download-dest.txt');
      fs.writeFileSync(localUpload, 'Test content for download');
      const remotePath = '/uploads/test-download.txt';

      // Upload first
      await ftpClient.uploadFile(localUpload, remotePath);

      // Act
      await ftpClient.downloadFile(remotePath, localDownload);

      // Assert
      expect(fs.existsSync(localDownload)).toBe(true);
      const content = fs.readFileSync(localDownload, 'utf-8');
      expect(content).toBe('Test content for download');

      // Cleanup
      await ftpClient.deleteFile(remotePath);
      fs.unlinkSync(localUpload);
      fs.unlinkSync(localDownload);
    });

    test('Can list files in directory', async ({ ftpClient }) => {
      // Act
      const files = await ftpClient.listFiles('/');

      // Assert
      expect(Array.isArray(files)).toBe(true);
    });

    test('Can check if file exists', async ({ ftpClient }) => {
      // Act
      const exists = await ftpClient.fileExists('/nonexistent-file.txt');

      // Assert
      expect(exists).toBe(false);
    });
  });

  test.describe('Directory Operations', () => {
    test('Can create and delete directory', async ({ ftpClient }) => {
      // Arrange
      const dirPath = '/test-directory-' + Date.now();

      // Act - Create
      await ftpClient.createDirectory(dirPath);

      // Assert
      const files = await ftpClient.listFiles('/');
      const dirExists = files.some(f => f.path.includes(dirPath.substring(1)));
      
      // Cleanup
      await ftpClient.deleteDirectory(dirPath);
    });

    test('Can get current directory', async ({ ftpClient }) => {
      // Act
      const currentDir = await ftpClient.getCurrentDirectory();

      // Assert
      expect(currentDir).toBeDefined();
      expect(typeof currentDir).toBe('string');
    });
  });
});
