/**
 * User API Tests
 */

import { test, expect } from '../fixtures';
import { User } from '../models';

test.describe('User API', () => {
  const testUsername = `testuser_${Date.now()}`;

  const testUser: User = {
    id: Math.floor(Math.random() * 100000),
    username: testUsername,
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'password123',
    phone: '1234567890',
    userStatus: 1,
  };

  test.describe('Create User', () => {
    test('should create a new user', async ({ userActions }) => {
      const response = await userActions.createUser(testUser);
      
      expect(response).toBeDefined();
    });

    test('should create user with minimal data', async ({ userActions }) => {
      const minimalUser: User = {
        username: `minimal_${Date.now()}`,
      };
      
      const response = await userActions.createUser(minimalUser);
      expect(response).toBeDefined();
    });

    test('should create multiple users with list', async ({ userActions }) => {
      const users: User[] = [
        { username: `batch1_${Date.now()}`, firstName: 'Batch', lastName: 'One' },
        { username: `batch2_${Date.now()}`, firstName: 'Batch', lastName: 'Two' },
      ];
      
      const response = await userActions.createUsersWithList(users);
      expect(response).toBeDefined();
    });
  });

  test.describe('Get User', () => {
    test.beforeEach(async ({ userActions }) => {
      await userActions.createUser(testUser);
    });

    test('should get user by username', async ({ userActions }) => {
      const user = await userActions.getUserByUsername(testUsername);
      
      expect(user.username).toBe(testUsername);
      expect(user.firstName).toBe(testUser.firstName);
      expect(user.lastName).toBe(testUser.lastName);
    });

    test('should throw error for non-existent user', async ({ userActions }) => {
      await expect(userActions.getUserByUsername('nonexistent_user_xyz')).rejects.toThrow('User not found');
    });
  });

  test.describe('Update User', () => {
    test.beforeEach(async ({ userActions }) => {
      await userActions.createUser(testUser);
    });

    test('should update user details', async ({ userActions }) => {
      const updatedUser: User = {
        ...testUser,
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      };
      
      await userActions.updateUser(testUsername, updatedUser);
      
      const user = await userActions.getUserByUsername(testUsername);
      expect(user.firstName).toBe('Updated');
      expect(user.lastName).toBe('Name');
    });
  });

  test.describe('Delete User', () => {
    test('should delete a user', async ({ userActions }) => {
      const userToDelete: User = {
        username: `todelete_${Date.now()}`,
        firstName: 'Delete',
        lastName: 'Me',
      };
      await userActions.createUser(userToDelete);
      
      await userActions.deleteUser(userToDelete.username);
      
      const exists = await userActions.userExists(userToDelete.username);
      expect(exists).toBe(false);
    });
  });

  test.describe('User Authentication', () => {
    test.beforeEach(async ({ userActions }) => {
      await userActions.createUser(testUser);
    });

    test('should login user', async ({ userActions }) => {
      const response = await userActions.login(testUsername, testUser.password!);
      
      expect(response).toBeDefined();
      // Response should contain session token
      expect(typeof response).toBe('string');
    });

    test('should logout user', async ({ userActions }) => {
      await userActions.login(testUsername, testUser.password!);
      
      // Logout should not throw
      await expect(userActions.logout()).resolves.not.toThrow();
    });
  });

  test.describe('User Lifecycle', () => {
    test('should complete full user lifecycle', async ({ userActions }) => {
      const lifecycleUsername = `lifecycle_${Date.now()}`;
      const lifecycleUser: User = {
        username: lifecycleUsername,
        firstName: 'Lifecycle',
        lastName: 'User',
        email: 'lifecycle@example.com',
        password: 'password123',
      };

      // Create
      await userActions.createUser(lifecycleUser);

      // Read
      const fetched = await userActions.getUserByUsername(lifecycleUsername);
      expect(fetched.username).toBe(lifecycleUsername);

      // Update
      await userActions.updateUser(lifecycleUsername, {
        ...lifecycleUser,
        firstName: 'Updated Lifecycle',
      });
      const updated = await userActions.getUserByUsername(lifecycleUsername);
      expect(updated.firstName).toBe('Updated Lifecycle');

      // Delete
      await userActions.deleteUser(lifecycleUsername);
      const exists = await userActions.userExists(lifecycleUsername);
      expect(exists).toBe(false);
    });
  });

  test.describe('User Validation', () => {
    test('should handle user with special characters in username', async ({ userActions }) => {
      const specialUser: User = {
        username: `special_user_${Date.now()}`,
        firstName: "O'Brien",
        lastName: 'Test-User',
      };
      
      await userActions.createUser(specialUser);
      const user = await userActions.getUserByUsername(specialUser.username);
      
      expect(user.firstName).toBe("O'Brien");
    });

    test('should handle user with long email', async ({ userActions }) => {
      const longEmailUser: User = {
        username: `longemail_${Date.now()}`,
        email: 'verylongemailaddress@verylongdomainname.example.com',
      };
      
      const response = await userActions.createUser(longEmailUser);
      expect(response).toBeDefined();
    });
  });
});
