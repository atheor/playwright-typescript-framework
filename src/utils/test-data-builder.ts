/**
 * Test Data Builder
 * Factory for generating test data using Faker
 */

import { faker } from '@faker-js/faker';

/**
 * User data interface
 */
export interface UserData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  dateOfBirth: Date;
}

/**
 * Address data interface
 */
export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Payment data interface
 */
export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  cardType: string;
}

/**
 * Product data interface
 */
export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
}

/**
 * Company data interface
 */
export interface CompanyData {
  name: string;
  catchPhrase: string;
  industry: string;
  website: string;
}

/**
 * Test Data Builder Class
 * Provides fluent API for generating test data
 */
export class TestDataBuilder {
  /**
   * Set locale for data generation
   * Note: Faker 8.x uses constructor-based locale, this is kept for API compatibility
   */
  public setLocale(_locale: string): this {
    // Faker 8.x doesn't support runtime locale change
    // Locale should be set when importing faker
    return this;
  }

  /**
   * Set seed for reproducible data
   */
  public setSeed(seed: number): this {
    faker.seed(seed);
    return this;
  }

  /**
   * Generate user data
   */
  public user(overrides: Partial<UserData> = {}): UserData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      password: faker.internet.password({ length: 12, memorable: false }),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      ...overrides,
    };
  }

  /**
   * Generate address data
   */
  public address(overrides: Partial<AddressData> = {}): AddressData {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      ...overrides,
    };
  }

  /**
   * Generate payment data
   */
  public payment(overrides: Partial<PaymentData> = {}): PaymentData {
    return {
      cardNumber: faker.finance.creditCardNumber(),
      cardHolder: faker.person.fullName(),
      expiryDate: `${faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0')}/${faker.number.int({ min: 25, max: 30 })}`,
      cvv: faker.finance.creditCardCVV(),
      cardType: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
      ...overrides,
    };
  }

  /**
   * Generate product data
   */
  public product(overrides: Partial<ProductData> = {}): ProductData {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      category: faker.commerce.department(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      ...overrides,
    };
  }

  /**
   * Generate company data
   */
  public company(overrides: Partial<CompanyData> = {}): CompanyData {
    const companyName = faker.company.name();
    return {
      name: companyName,
      catchPhrase: faker.company.catchPhrase(),
      industry: faker.company.buzzNoun(),
      website: faker.internet.url(),
      ...overrides,
    };
  }

  /**
   * Generate random string
   */
  public string(length: number = 10): string {
    return faker.string.alphanumeric(length);
  }

  /**
   * Generate random number
   */
  public number(min: number = 0, max: number = 100): number {
    return faker.number.int({ min, max });
  }

  /**
   * Generate random email
   */
  public email(): string {
    return faker.internet.email().toLowerCase();
  }

  /**
   * Generate random UUID
   */
  public uuid(): string {
    return faker.string.uuid();
  }

  /**
   * Generate random date
   */
  public date(options: { min?: Date; max?: Date } = {}): Date {
    return faker.date.between({
      from: options.min ?? new Date('2020-01-01'),
      to: options.max ?? new Date(),
    });
  }

  /**
   * Generate random boolean
   */
  public boolean(): boolean {
    return faker.datatype.boolean();
  }

  /**
   * Generate random item from array
   */
  public oneOf<T>(items: T[]): T {
    return faker.helpers.arrayElement(items);
  }

  /**
   * Generate multiple items
   */
  public many<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }

  /**
   * Generate lorem ipsum text
   */
  public text(options: { paragraphs?: number; sentences?: number; words?: number } = {}): string {
    if (options.paragraphs) {
      return faker.lorem.paragraphs(options.paragraphs);
    }
    if (options.sentences) {
      return faker.lorem.sentences(options.sentences);
    }
    if (options.words) {
      return faker.lorem.words(options.words);
    }
    return faker.lorem.paragraph();
  }
}

// Export singleton instance
export const testData = new TestDataBuilder();
