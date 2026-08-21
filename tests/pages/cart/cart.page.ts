import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly checkoutButton: Locator;
  readonly items: Locator;
  readonly title: Locator;

  private readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.checkoutButton = page.getByTestId('checkout');
    this.items = page.getByTestId('inventory-item');
    this.title = page.getByTestId('title');
  }

  product(productName: string): Locator {
    return this.page.getByTestId('inventory-item').filter({ hasText: productName });
  }

  productName(productName: string): Locator {
    return this.product(productName).getByTestId('inventory-item-name');
  }

  async openFromHeader(): Promise<void> {
    await this.cartLink.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
