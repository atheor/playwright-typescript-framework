/**
 * Pet API Actions
 * Higher-level actions for Pet endpoints
 */

import { ApiClient } from '../../../src';
import { Logger } from '../../../src/utils/logger';
import { Pet, ApiResponse } from '../models';

/**
 * Pet API Actions
 */
export class PetActions {
  private client: ApiClient;
  private logger: Logger;

  constructor(client: ApiClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Create a new pet
   */
  async createPet(pet: Pet): Promise<Pet> {
    this.logger.step(1, `Creating pet: ${pet.name}`);
    const response = await this.client.post<Pet>('/pet', pet);
    
    if (response.status !== 200) {
      throw new Error(`Failed to create pet: ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Get pet by ID
   */
  async getPetById(petId: number): Promise<Pet> {
    this.logger.step(1, `Getting pet by ID: ${petId}`);
    const response = await this.client.get<Pet>(`/pet/${petId}`);
    
    if (response.status === 404) {
      throw new Error(`Pet not found: ${petId}`);
    }
    
    return response.data;
  }

  /**
   * Update an existing pet
   */
  async updatePet(pet: Pet): Promise<Pet> {
    this.logger.step(1, `Updating pet: ${pet.id}`);
    const response = await this.client.put<Pet>('/pet', pet);
    
    if (response.status !== 200) {
      throw new Error(`Failed to update pet: ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Delete a pet
   */
  async deletePet(petId: number): Promise<void> {
    this.logger.step(1, `Deleting pet: ${petId}`);
    const response = await this.client.delete<ApiResponse>(`/pet/${petId}`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to delete pet: ${response.status}`);
    }
  }

  /**
   * Find pets by status
   */
  async findPetsByStatus(status: 'available' | 'pending' | 'sold'): Promise<Pet[]> {
    this.logger.step(1, `Finding pets by status: ${status}`);
    const response = await this.client.get<Pet[]>('/pet/findByStatus', { status });
    
    return response.data;
  }

  /**
   * Update pet status
   */
  async updatePetStatus(petId: number, name: string, status: 'available' | 'pending' | 'sold'): Promise<ApiResponse> {
    this.logger.step(1, `Updating pet ${petId} status to: ${status}`);
    
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('status', status);
    
    const response = await this.client.post<ApiResponse>(
      `/pet/${petId}`,
      formData.toString(),
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    
    return response.data;
  }

  /**
   * Check if pet exists
   */
  async petExists(petId: number): Promise<boolean> {
    try {
      const response = await this.client.get<Pet>(`/pet/${petId}`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
