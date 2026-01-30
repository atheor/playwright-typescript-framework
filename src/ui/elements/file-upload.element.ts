/**
 * File Upload Element
 * Wrapper for file input elements
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';
import * as fs from 'fs';
import * as path from 'path';

export interface FileUploadOptions extends ElementOptions {
  /** Accept only specific file types */
  acceptedTypes?: string[];
}

/**
 * FileUpload element wrapper
 */
export class FileUploadElement extends BaseElement {
  protected uploadOptions: FileUploadOptions;

  constructor(locator: Locator, options: FileUploadOptions = {}) {
    super(locator, options);
    this.uploadOptions = {
      ...options,
    };
  }

  /**
   * Upload a single file
   */
  public async upload(filePath: string): Promise<this> {
    await this.validateFile(filePath);
    
    await this.executeWithRetry(async () => {
      this.logAction('upload', { file: path.basename(filePath) });
      await this.locator.setInputFiles(filePath, { timeout: this.options.timeout });
    }, 'upload');
    return this;
  }

  /**
   * Upload multiple files
   */
  public async uploadMultiple(filePaths: string[]): Promise<this> {
    for (const filePath of filePaths) {
      await this.validateFile(filePath);
    }

    await this.executeWithRetry(async () => {
      this.logAction('uploadMultiple', { files: filePaths.map((f) => path.basename(f)) });
      await this.locator.setInputFiles(filePaths, { timeout: this.options.timeout });
    }, 'uploadMultiple');
    return this;
  }

  /**
   * Upload file using drag and drop
   */
  public async uploadViaDragDrop(
    dropZone: Locator,
    filePath: string
  ): Promise<this> {
    await this.validateFile(filePath);

    await this.executeWithRetry(async () => {
      this.logAction('uploadViaDragDrop', { file: path.basename(filePath) });
      
      // Create a data transfer with the file
      const buffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      await dropZone.evaluate(
        async (el, { data, name }) => {
          const dt = new DataTransfer();
          const file = new File([new Uint8Array(data)], name);
          dt.items.add(file);

          el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
        },
        { data: Array.from(buffer), name: fileName }
      );
    }, 'uploadViaDragDrop');
    return this;
  }

  /**
   * Clear selected files
   */
  public async clear(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clear');
      await this.locator.setInputFiles([], { timeout: this.options.timeout });
    }, 'clear');
    return this;
  }

  /**
   * Get accepted file types
   */
  public async getAcceptedTypes(): Promise<string[]> {
    const accept = await this.getAttribute('accept');
    if (!accept) return [];
    return accept.split(',').map((t) => t.trim());
  }

  /**
   * Check if file type is accepted
   */
  public async isFileTypeAccepted(filePath: string): Promise<boolean> {
    const acceptedTypes = await this.getAcceptedTypes();
    if (acceptedTypes.length === 0) return true;

    const ext = path.extname(filePath).toLowerCase();
    return acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return type.toLowerCase() === ext;
      }
      // Handle MIME types like 'image/*'
      return type.includes('*') || ext.includes(type.replace('*', ''));
    });
  }

  /**
   * Check if multiple files are allowed
   */
  public async allowsMultiple(): Promise<boolean> {
    const multiple = await this.getAttribute('multiple');
    return multiple !== null;
  }

  /**
   * Validate file before upload
   */
  private async validateFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (this.uploadOptions.acceptedTypes && this.uploadOptions.acceptedTypes.length > 0) {
      const ext = path.extname(filePath).toLowerCase();
      const isAccepted = this.uploadOptions.acceptedTypes.some(
        (type) => type.toLowerCase() === ext || type === '*'
      );
      if (!isAccepted) {
        throw new Error(
          `File type ${ext} is not accepted. Accepted types: ${this.uploadOptions.acceptedTypes.join(', ')}`
        );
      }
    }
  }

  /**
   * Create a test file for upload
   */
  public static createTestFile(
    fileName: string,
    content: string = 'Test content',
    directory: string = '/tmp'
  ): string {
    const filePath = path.join(directory, fileName);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Verify file was uploaded (by checking if input has files)
   */
  public async andVerify(): Promise<this> {
    const hasFiles = await this.locator.evaluate((input: HTMLInputElement) => {
      return input.files && input.files.length > 0;
    });

    if (!hasFiles) {
      throw new Error('No files were uploaded');
    }

    this.logAction('verified');
    return this;
  }
}

/**
 * Factory function for creating FileUpload elements
 */
export function FileUpload(locator: Locator, options?: FileUploadOptions): FileUploadElement {
  return new FileUploadElement(locator, options);
}
