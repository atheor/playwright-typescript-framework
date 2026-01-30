/**
 * Pet API Tests
 */

import { test, expect } from '../fixtures';
import { Pet } from '../models';

test.describe('Pet API', () => {
  const testPetId = Math.floor(Math.random() * 1000000) + 1;

  const testPet: Pet = {
    id: testPetId,
    name: 'Fluffy',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/photo.jpg'],
    tags: [{ id: 1, name: 'friendly' }],
    status: 'available',
  };

  test.describe('Create Pet', () => {
    test('should create a new pet', async ({ petActions }) => {
      const createdPet = await petActions.createPet(testPet);
      
      expect(createdPet.id).toBe(testPet.id);
      expect(createdPet.name).toBe(testPet.name);
      expect(createdPet.status).toBe(testPet.status);
    });

    test('should create pet with minimal data', async ({ petActions }) => {
      const minimalPet: Pet = {
        id: testPetId + 1,
        name: 'Buddy',
        photoUrls: [],
      };
      
      const createdPet = await petActions.createPet(minimalPet);
      
      expect(createdPet.name).toBe('Buddy');
    });
  });

  test.describe('Get Pet', () => {
    test.beforeEach(async ({ petActions }) => {
      // Ensure test pet exists
      await petActions.createPet(testPet);
    });

    test('should get pet by ID', async ({ petActions }) => {
      const pet = await petActions.getPetById(testPetId);
      
      expect(pet.id).toBe(testPetId);
      expect(pet.name).toBe(testPet.name);
    });

    test('should throw error for non-existent pet', async ({ petActions }) => {
      await expect(petActions.getPetById(999999999)).rejects.toThrow('Pet not found');
    });
  });

  test.describe('Update Pet', () => {
    test.beforeEach(async ({ petActions }) => {
      await petActions.createPet(testPet);
    });

    test('should update pet details', async ({ petActions }) => {
      const updatedPet: Pet = {
        ...testPet,
        name: 'Fluffy Updated',
        status: 'sold',
      };
      
      const result = await petActions.updatePet(updatedPet);
      
      expect(result.name).toBe('Fluffy Updated');
      expect(result.status).toBe('sold');
    });
  });

  test.describe('Find Pets by Status', () => {
    test('should find available pets', async ({ petActions }) => {
      const pets = await petActions.findPetsByStatus('available');
      
      expect(Array.isArray(pets)).toBe(true);
      pets.forEach((pet) => {
        expect(pet.status).toBe('available');
      });
    });

    test('should find pending pets', async ({ petActions }) => {
      const pets = await petActions.findPetsByStatus('pending');
      
      expect(Array.isArray(pets)).toBe(true);
    });

    test('should find sold pets', async ({ petActions }) => {
      const pets = await petActions.findPetsByStatus('sold');
      
      expect(Array.isArray(pets)).toBe(true);
    });
  });

  test.describe('Delete Pet', () => {
    test('should delete a pet', async ({ petActions }) => {
      // Create a pet to delete
      const petToDelete: Pet = {
        id: testPetId + 100,
        name: 'ToDelete',
        photoUrls: [],
        status: 'available',
      };
      await petActions.createPet(petToDelete);
      
      // Delete the pet
      await petActions.deletePet(petToDelete.id!);
      
      // Verify pet is deleted
      const exists = await petActions.petExists(petToDelete.id!);
      expect(exists).toBe(false);
    });
  });

  test.describe('Pet Lifecycle', () => {
    test('should complete full pet lifecycle', async ({ petActions }) => {
      const lifecyclePetId = testPetId + 200;
      const lifecyclePet: Pet = {
        id: lifecyclePetId,
        name: 'Lifecycle Pet',
        photoUrls: ['https://example.com/lifecycle.jpg'],
        status: 'available',
      };

      // Create
      const created = await petActions.createPet(lifecyclePet);
      expect(created.id).toBe(lifecyclePetId);

      // Read
      const fetched = await petActions.getPetById(lifecyclePetId);
      expect(fetched.name).toBe('Lifecycle Pet');

      // Update
      const updated = await petActions.updatePet({
        ...lifecyclePet,
        name: 'Lifecycle Pet Updated',
        status: 'pending',
      });
      expect(updated.name).toBe('Lifecycle Pet Updated');

      // Delete
      await petActions.deletePet(lifecyclePetId);
      const exists = await petActions.petExists(lifecyclePetId);
      expect(exists).toBe(false);
    });
  });
});
