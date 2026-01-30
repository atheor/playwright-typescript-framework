/**
 * Base Framework Exception
 * All framework exceptions extend this base class
 */

export class FrameworkException extends Error {
  public readonly timestamp: Date;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    public readonly code: string,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get a formatted error message with context
   */
  public getFormattedMessage(): string {
    const contextStr = Object.keys(this.context).length > 0
      ? `\nContext: ${JSON.stringify(this.context, null, 2)}`
      : '';
    return `[${this.code}] ${this.message}${contextStr}`;
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}
