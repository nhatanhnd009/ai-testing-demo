import { test as base } from '@playwright/test';

import { LoginPage } from '../pages/login/login.page';
import { ProductListPage } from '../pages/products/product-list.page';

type AppFixtures = {
  loginPage: LoginPage;
  productListPage: ProductListPage;
};

const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
});

export { expect } from '@playwright/test';
export { test };
