/**
 * GraphQL Client
 * Client for GraphQL API interactions
 */

import { ApiClient, ApiClientOptions } from './api-client';
import { ApiResponse } from '../models/api.models';
import { ApiValidationException } from '../../core/exceptions';

/**
 * GraphQL request variables
 */
export type GraphQLVariables = Record<string, unknown>;

/**
 * GraphQL error format
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL response format
 */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * GraphQL operation type
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

/**
 * GraphQL Client for executing queries and mutations
 */
export class GraphQLClient extends ApiClient {
  private endpoint: string;

  constructor(options: ApiClientOptions & { endpoint?: string } = {}) {
    super(options);
    this.endpoint = options.endpoint ?? '/graphql';
  }

  /**
   * Execute GraphQL query
   */
  public async query<T>(
    query: string,
    variables?: GraphQLVariables,
    operationName?: string
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.execute<T>(query, variables, operationName);
  }

  /**
   * Execute GraphQL mutation
   */
  public async mutate<T>(
    mutation: string,
    variables?: GraphQLVariables,
    operationName?: string
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.execute<T>(mutation, variables, operationName);
  }

  /**
   * Execute GraphQL operation
   */
  private async execute<T>(
    query: string,
    variables?: GraphQLVariables,
    operationName?: string
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    const response = await this.post<GraphQLResponse<T>>(this.endpoint, {
      query,
      variables,
      operationName,
    });

    // Check for GraphQL errors
    if (response.data.errors && response.data.errors.length > 0) {
      const errorMessages = response.data.errors.map((e: GraphQLError) => e.message);
      throw new ApiValidationException(this.endpoint, errorMessages, response.data);
    }

    return response;
  }

  /**
   * Execute raw GraphQL request with custom headers
   */
  public async executeRaw<T>(
    query: string,
    variables?: GraphQLVariables,
    headers?: Record<string, string>
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.post<GraphQLResponse<T>>(
      this.endpoint,
      { query, variables },
      headers
    );
  }

  /**
   * Create query builder for type-safe queries
   */
  public createQueryBuilder(): GraphQLQueryBuilder {
    return new GraphQLQueryBuilder();
  }
}

/**
 * GraphQL Query Builder
 * Helps construct GraphQL queries programmatically
 */
export class GraphQLQueryBuilder {
  private operationType: GraphQLOperationType = 'query';
  private operationName?: string;
  private fields: string[] = [];
  private queryArguments: Record<string, { type: string; value: unknown }> = {};

  /**
   * Set operation type
   */
  public setOperationType(type: GraphQLOperationType): this {
    this.operationType = type;
    return this;
  }

  /**
   * Set operation name
   */
  public setOperationName(name: string): this {
    this.operationName = name;
    return this;
  }

  /**
   * Add field to query
   */
  public addField(field: string): this {
    this.fields.push(field);
    return this;
  }

  /**
   * Add multiple fields
   */
  public addFields(fields: string[]): this {
    this.fields.push(...fields);
    return this;
  }

  /**
   * Add argument
   */
  public addArgument(name: string, type: string, value: unknown): this {
    this.queryArguments[name] = { type, value };
    return this;
  }

  /**
   * Build the query string
   */
  public build(): { query: string; variables: GraphQLVariables } {
    const variables: GraphQLVariables = {};
    const argDefs: string[] = [];
    const argUsages: string[] = [];

    Object.entries(this.queryArguments).forEach(([name, { type, value }]) => {
      argDefs.push(`$${name}: ${type}`);
      argUsages.push(`${name}: $${name}`);
      variables[name] = value;
    });

    const argDefStr = argDefs.length > 0 ? `(${argDefs.join(', ')})` : '';
    const argUseStr = argUsages.length > 0 ? `(${argUsages.join(', ')})` : '';
    const fieldsStr = this.fields.join('\n    ');
    const opName = this.operationName ?? 'Operation';

    const query = `
      ${this.operationType} ${opName}${argDefStr} {
        ${opName.toLowerCase()}${argUseStr} {
          ${fieldsStr}
        }
      }
    `.trim();

    return { query, variables };
  }

  /**
   * Reset builder
   */
  public reset(): this {
    this.operationType = 'query';
    this.operationName = undefined;
    this.fields = [];
    this.queryArguments = {};
    return this;
  }
}

/**
 * Factory function for creating GraphQL client
 */
export function createGraphQLClient(
  options?: ApiClientOptions & { endpoint?: string }
): GraphQLClient {
  return new GraphQLClient(options);
}
