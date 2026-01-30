/**
 * Example Tests - Login Feature
 * Demonstrates the three-layer test architecture
 */

import { test, expect } from '../../fixtures/example-fixtures';
import { testData } from '../../../src';

/**
 * Test Suite: Login Feature
 * Tests only orchestrate workflows - no direct page interactions
 */
test.describe('Login Feature', () => {
  test.describe('Valid Login', () => {
    test('User can login with valid credentials', async ({ loginWorkflow }) => {
      // Arrange
      const username = 'testuser@example.com';
      const password = 'ValidPassword123';

      // Act & Assert
      await loginWorkflow.loginAndVerifySuccess(username, password);
    });

    test('User can login with remember me option', async ({ loginWorkflow }) => {
      // Arrange
      const username = 'testuser@example.com';
      const password = 'ValidPassword123';

      // Act
      await loginWorkflow.login(username, password, true);

      // Assert - in real test would verify cookie/session persistence
    });
  });

  test.describe('Invalid Login', () => {
    test('User sees error with invalid credentials', async ({ loginWorkflow }) => {
      // Arrange
      const username = 'invalid@example.com';
      const password = 'wrongpassword';

      // Act
      const errorMessage = await loginWorkflow.loginAndVerifyFailure(username, password);

      // Assert
      expect(errorMessage).toContain('Invalid credentials');
    });

    test('User sees error with empty credentials', async ({ loginWorkflow }) => {
      // Act
      const errorMessage = await loginWorkflow.loginAndVerifyFailure('', '');

      // Assert
      expect(errorMessage).toContain('required');
    });
  });

  test.describe('Password Reset', () => {
    test('User can navigate to forgot password', async ({ loginWorkflow }) => {
      // Act
      await loginWorkflow.requestPasswordReset();

      // Assert - would verify navigation to password reset page
    });
  });
});
