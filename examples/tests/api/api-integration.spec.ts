/**
 * Example Tests - API Integration
 */

import { test, expect } from '../../fixtures/example-fixtures';
import { testData } from '../../../src';

/**
 * Test Suite: API Integration Tests
 * Demonstrates combined UI and API testing
 */
test.describe('API Integration Tests', () => {
  test.describe('Authentication', () => {
    test('API login establishes browser session', async ({ apiIntegrationWorkflow }) => {
      // Arrange
      const username = 'testuser@example.com';
      const password = 'password123';

      // Act
      await apiIntegrationWorkflow.loginViaApi(username, password);

      // Assert - would verify browser has authentication
    });
  });

  test.describe('Data Consistency', () => {
    test('Product created via API appears in UI', async ({ apiIntegrationWorkflow }) => {
      // Arrange
      const productData = {
        name: `Test Product ${testData.uuid()}`,
        price: 99.99,
        category: 'Electronics',
      };

      // Act
      const productId = await apiIntegrationWorkflow.createTestProduct(productData);
      const existsInUI = await apiIntegrationWorkflow.verifyProductInUI(productId);

      // Assert
      expect(existsInUI).toBe(true);

      // Cleanup
      await apiIntegrationWorkflow.cleanupTestData([productId]);
    });
  });
});

/**
 * Test Suite: Pure API Tests
 */
test.describe('API Tests', () => {
  test('Health check endpoint returns healthy', async ({ apiClient }) => {
    // Act
    const result = await apiClient.healthCheck();

    // Assert
    expect(result.healthy).toBe(true);
    expect(result.responseTime).toBeLessThan(1000);
  });

  test('Can fetch products list', async ({ apiClient }) => {
    // Act
    const response = await apiClient.get<{ products: unknown[] }>('/products');

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.products).toBeDefined();
  });

  test('Can create and delete a resource', async ({ apiClient }) => {
    // Arrange
    const newProduct = {
      name: 'Test Product',
      price: 29.99,
      category: 'Test',
    };

    // Act - Create
    const createResponse = await apiClient.post<{ id: string }>('/products', newProduct);
    expect(createResponse.status).toBe(201);
    const productId = createResponse.data.id;

    // Act - Delete
    const deleteResponse = await apiClient.delete(`/products/${productId}`);
    expect(deleteResponse.status).toBe(204);
  });
});
