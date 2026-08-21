import type { Locator, Page } from '@playwright/test';

export class ProductListPage {
  readonly inventory: Locator;
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.inventory = page.getByTestId('inventory-container');
  }

  product(productName: string): Locator {
    return this.page
      .getByTestId('inventory-item')
      .filter({ hasText: productName });
  }

  productButton(productName: string, buttonName: string): Locator {
    return this.product(productName).getByRole('button', {
      name: buttonName,
      exact: true,
    });
  }

  async addProduct(productName: string, buttonName: string): Promise<void> {
    await this.productButton(productName, buttonName).click();
  }

  async removeProduct(productName: string, buttonName: string): Promise<void> {
    await this.productButton(productName, buttonName).click();
  }
}
