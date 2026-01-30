/**
 * Table Element
 * Wrapper for HTML table elements
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface TableOptions extends ElementOptions {
  /** Header row selector */
  headerSelector?: string;
  /** Body row selector */
  rowSelector?: string;
  /** Cell selector */
  cellSelector?: string;
}

export interface TableRow {
  index: number;
  cells: string[];
  element: Locator;
}

/**
 * Table element wrapper
 */
export class TableElement extends BaseElement {
  protected tableOptions: TableOptions;

  constructor(locator: Locator, options: TableOptions = {}) {
    super(locator, options);
    this.tableOptions = {
      headerSelector: 'thead th, thead td',
      rowSelector: 'tbody tr',
      cellSelector: 'td',
      ...options,
    };
  }

  /**
   * Get table headers
   */
  public async getHeaders(): Promise<string[]> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      const headers = this.locator.locator(this.tableOptions.headerSelector!);
      const count = await headers.count();
      const result: string[] = [];

      for (let i = 0; i < count; i++) {
        const text = await headers.nth(i).textContent();
        result.push(text?.trim() ?? '');
      }

      return result;
    }, 'getHeaders');
  }

  /**
   * Get all rows
   */
  public async getRows(): Promise<TableRow[]> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      const rows = this.locator.locator(this.tableOptions.rowSelector!);
      const count = await rows.count();
      const result: TableRow[] = [];

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const cells = row.locator(this.tableOptions.cellSelector!);
        const cellCount = await cells.count();
        const cellValues: string[] = [];

        for (let j = 0; j < cellCount; j++) {
          const text = await cells.nth(j).textContent();
          cellValues.push(text?.trim() ?? '');
        }

        result.push({
          index: i,
          cells: cellValues,
          element: row,
        });
      }

      return result;
    }, 'getRows');
  }

  /**
   * Get row count
   */
  public async getRowCount(): Promise<number> {
    await this.waitFor();
    return await this.locator.locator(this.tableOptions.rowSelector!).count();
  }

  /**
   * Get column count
   */
  public async getColumnCount(): Promise<number> {
    const headers = await this.getHeaders();
    return headers.length;
  }

  /**
   * Get cell value by row and column index
   */
  public async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      const row = this.locator.locator(this.tableOptions.rowSelector!).nth(rowIndex);
      const cell = row.locator(this.tableOptions.cellSelector!).nth(columnIndex);
      return (await cell.textContent())?.trim() ?? '';
    }, 'getCellValue');
  }

  /**
   * Get cell value by row index and column header
   */
  public async getCellByHeader(rowIndex: number, headerName: string): Promise<string> {
    const headers = await this.getHeaders();
    const columnIndex = headers.findIndex(
      (h) => h.toLowerCase() === headerName.toLowerCase()
    );

    if (columnIndex === -1) {
      throw new Error(`Header "${headerName}" not found`);
    }

    return await this.getCellValue(rowIndex, columnIndex);
  }

  /**
   * Get entire column values by index
   */
  public async getColumn(columnIndex: number): Promise<string[]> {
    const rows = await this.getRows();
    return rows.map((row) => row.cells[columnIndex] ?? '');
  }

  /**
   * Get entire column values by header name
   */
  public async getColumnByHeader(headerName: string): Promise<string[]> {
    const headers = await this.getHeaders();
    const columnIndex = headers.findIndex(
      (h) => h.toLowerCase() === headerName.toLowerCase()
    );

    if (columnIndex === -1) {
      throw new Error(`Header "${headerName}" not found`);
    }

    return await this.getColumn(columnIndex);
  }

  /**
   * Find row by cell value
   */
  public async findRow(columnIndex: number, value: string): Promise<TableRow | null> {
    const rows = await this.getRows();
    return rows.find((row) => row.cells[columnIndex] === value) ?? null;
  }

  /**
   * Find row by header and value
   */
  public async findRowByHeader(
    headerName: string,
    value: string
  ): Promise<TableRow | null> {
    const headers = await this.getHeaders();
    const columnIndex = headers.findIndex(
      (h) => h.toLowerCase() === headerName.toLowerCase()
    );

    if (columnIndex === -1) {
      return null;
    }

    return await this.findRow(columnIndex, value);
  }

  /**
   * Click cell by row and column index
   */
  public async clickCell(rowIndex: number, columnIndex: number): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickCell', { rowIndex, columnIndex });
      await this.waitFor();
      const row = this.locator.locator(this.tableOptions.rowSelector!).nth(rowIndex);
      const cell = row.locator(this.tableOptions.cellSelector!).nth(columnIndex);
      await cell.click({ timeout: this.options.timeout });
    }, 'clickCell');
    return this;
  }

  /**
   * Click row by index
   */
  public async clickRow(rowIndex: number): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickRow', { rowIndex });
      await this.waitFor();
      const row = this.locator.locator(this.tableOptions.rowSelector!).nth(rowIndex);
      await row.click({ timeout: this.options.timeout });
    }, 'clickRow');
    return this;
  }

  /**
   * Get table data as array of objects
   */
  public async getData(): Promise<Record<string, string>[]> {
    const headers = await this.getHeaders();
    const rows = await this.getRows();

    return rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row.cells[index] ?? '';
      });
      return obj;
    });
  }

  /**
   * Search table for value
   */
  public async search(value: string): Promise<{ row: number; column: number }[]> {
    const rows = await this.getRows();
    const results: { row: number; column: number }[] = [];

    rows.forEach((row, rowIndex) => {
      row.cells.forEach((cell, columnIndex) => {
        if (cell.toLowerCase().includes(value.toLowerCase())) {
          results.push({ row: rowIndex, column: columnIndex });
        }
      });
    });

    return results;
  }

  /**
   * Verify table contains value
   */
  public async andVerify(expectedValue: string): Promise<this> {
    const results = await this.search(expectedValue);
    if (results.length === 0) {
      throw new Error(`Table does not contain value "${expectedValue}"`);
    }
    this.logAction('verified', { value: expectedValue, found: results.length });
    return this;
  }
}

/**
 * Factory function for creating Table elements
 */
export function Table(locator: Locator, options?: TableOptions): TableElement {
  return new TableElement(locator, options);
}
