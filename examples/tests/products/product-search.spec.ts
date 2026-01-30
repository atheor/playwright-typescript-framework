/**
 * Example Tests - Product Search Feature
 */

import { test, expect } from '../../fixtures/example-fixtures';

/**
 * Test Suite: Product Search Feature
 */
test.describe('Product Search Feature', () => {
  test.describe('Product Filtering', () => {
    test('User can filter products by category', async ({ productSearchWorkflow }) => {
      // Arrange
      const category = 'Electronics';

      // Act
      const productCount = await productSearchWorkflow.searchAndFilter({ category });

      // Assert
      expect(productCount).toBeGreaterThan(0);
    });

    test('User can filter products by price range', async ({ productSearchWorkflow }) => {
      // Arrange
      const minPrice = 50;
      const maxPrice = 200;

      // Act
      const productCount = await productSearchWorkflow.searchAndFilter({
        minPrice,
        maxPrice,
      });

      // Assert
      expect(productCount).toBeGreaterThan(0);
    });

    test('User can apply multiple filters', async ({ productSearchWorkflow }) => {
      // Arrange
      const filters = {
        category: 'Electronics',
        minPrice: 100,
        maxPrice: 500,
        sortBy: 'Price: Low to High',
      };

      // Act
      const productCount = await productSearchWorkflow.searchAndFilter(filters);

      // Assert
      expect(productCount).toBeGreaterThan(0);
    });
  });

  test.describe('Product Selection', () => {
    test('User can select a product from the list', async ({ productSearchWorkflow }) => {
      // Arrange
      await productSearchWorkflow.navigateToProducts();
      const products = await productSearchWorkflow.getAllProductNames();
      
      // Act
      if (products.length > 0) {
        await productSearchWorkflow.selectProduct(products[0]);
      }

      // Assert - would verify navigation to product detail page
    });
  });
});
