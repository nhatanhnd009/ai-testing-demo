import { test as base } from '@playwright/test';

import { CartPage } from '../pages/cart/cart.page';
import { CheckoutOverviewPage } from '../pages/checkout/checkout-overview.page';
import { CheckoutPage } from '../pages/checkout/checkout.page';
import { LoginPage } from '../pages/login/login.page';
import { ProductListPage } from '../pages/products/product-list.page';

type AppFixtures = {
  cartPage: CartPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutPage: CheckoutPage;
  loginPage: LoginPage;
  productListPage: ProductListPage;
};

const test = base.extend<AppFixtures>({
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
});

export { expect } from '@playwright/test';
export { test };
