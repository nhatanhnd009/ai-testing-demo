import type { Locator, Page } from '@playwright/test';

export class CheckoutOverviewPage {
  readonly items: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly title: Locator;
  readonly totalLabel: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
  }

  product(productName: string): Locator {
    return this.page.getByTestId('inventory-item').filter({ hasText: productName });
  }

  productDescription(productName: string): Locator {
    return this.product(productName).getByTestId('inventory-item-desc');
  }

  productName(productName: string): Locator {
    return this.product(productName).getByTestId('inventory-item-name');
  }

  productPrice(productName: string): Locator {
    return this.product(productName).getByTestId('inventory-item-price');
  }
}
