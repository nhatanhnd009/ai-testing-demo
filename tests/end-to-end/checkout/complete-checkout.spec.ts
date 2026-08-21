import testData from './complete-checkout.json';
import { loadCredentialProfile, type CredentialProfileName } from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-006 | Complete checkout information and continue to payment step', async ({
  cartPage,
  checkoutOverviewPage,
  checkoutPage,
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-006'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  await test.step('Log in and add a product', async () => {
    await loginPage.open();
    await loginPage.login(credentials);
    await productListPage.addProduct(data.productName, data.addButtonName);
  });

  await test.step('Open checkout information', async () => {
    await cartPage.openFromHeader();
    await cartPage.checkout();
    await expect(checkoutPage.title).toHaveText(data.expectedCheckoutTitle);
  });

  await test.step('Continue to the payment step', async () => {
    await checkoutPage.fillInformation(data.customer);
    await checkoutPage.continue();
    await expect(checkoutOverviewPage.title).toHaveText(data.expectedOverviewTitle);
  });
});
