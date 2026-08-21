import type { Page } from '@playwright/test';

import testData from './checkout-required-fields.json';
import {
  loadCredentialProfile,
  type CredentialProfile,
  type CredentialProfileName,
} from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';
import type { LoginPage } from '../../pages/login/login.page';
import type { ProductListPage } from '../../pages/products/product-list.page';

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

test('HC-007 | Validate required checkout fields', async ({
  cartPage,
  checkoutPage,
  loginPage,
  page,
  productListPage,
}) => {
  const data = testData['HC-007'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  for (const scenario of data.scenarios) {
    await test.step(scenario.stepLabel, async () => {
      await logInWithCleanCart(page, loginPage, credentials);
      await productListPage.addProduct(data.productName, data.addButtonName);
      await cartPage.openFromHeader();
      await cartPage.checkout();
      await expect(checkoutPage.title).toHaveText(data.expectedCheckoutTitle);
      await checkoutPage.fillInformationExcept(
        data.baseCustomer,
        scenario.missingField,
      );
      await checkoutPage.continue();
      await expect(checkoutPage.errorMessage).toHaveText(scenario.expectedError);
      await expect(checkoutPage.errorContainer).toHaveCSS(
        data.errorCssProperty,
        data.expectedErrorBackgroundColor,
      );
      await expect(checkoutPage.title).toHaveText(data.expectedCheckoutTitle);
    });
  }
});
