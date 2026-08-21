import type { Page } from '@playwright/test';

import testData from './checkout-summary.json';
import {
  loadCredentialProfile,
  type CredentialProfile,
  type CredentialProfileName,
} from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';
import type { LoginPage } from '../../pages/login/login.page';
import type { ProductListPage } from '../../pages/products/product-list.page';

type ProductFixture = {
  addButtonName: string;
  description: string;
  name: string;
  price: string;
};

async function logInWithCleanCart(
  page: Page,
  loginPage: LoginPage,
  credentials: CredentialProfile,
): Promise<void> {
  await loginPage.open();
  await page.evaluate(() => localStorage.clear());
  await loginPage.open();
  await loginPage.login(credentials);
}

async function addProducts(
  productListPage: ProductListPage,
  products: ProductFixture[],
): Promise<void> {
  for (const product of products) {
    await productListPage.addProduct(product.name, product.addButtonName);
  }
}

test('HC-005 | Open checkout and verify product summary for cart contents', async ({
  cartPage,
  checkoutOverviewPage,
  checkoutPage,
  loginPage,
  page,
  productListPage,
}) => {
  const data = testData['HC-005'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  for (const scenario of data.scenarios) {
    await test.step(scenario.stepLabel, async () => {
      await logInWithCleanCart(page, loginPage, credentials);
      await addProducts(productListPage, scenario.products);
      await cartPage.openFromHeader();
      await cartPage.checkout();
      await expect(checkoutPage.title).toHaveText(data.expectedCheckoutTitle);
      await checkoutPage.fillInformation(data.customer);
      await checkoutPage.continue();
      await expect(checkoutOverviewPage.title).toHaveText(data.expectedOverviewTitle);
      await expect(checkoutOverviewPage.items).toHaveCount(scenario.expectedItemCount);
      await expect(checkoutOverviewPage.subtotalLabel).toHaveText(
        scenario.expectedSubtotal,
      );
      await expect(checkoutOverviewPage.taxLabel).toHaveText(scenario.expectedTax);
      await expect(checkoutOverviewPage.totalLabel).toHaveText(
        scenario.expectedTotal,
      );

      for (const product of scenario.products) {
        await expect(checkoutOverviewPage.productName(product.name)).toHaveText(
          product.name,
        );
        await expect(
          checkoutOverviewPage.productDescription(product.name),
        ).toHaveText(product.description);
        await expect(checkoutOverviewPage.productPrice(product.name)).toHaveText(
          product.price,
        );
      }
    });
  }
});
