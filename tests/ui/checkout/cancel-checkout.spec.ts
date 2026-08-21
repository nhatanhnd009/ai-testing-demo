import testData from './cancel-checkout.json';
import { loadCredentialProfile, type CredentialProfileName } from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-008 | Cancel checkout returns to cart without removing product', async ({
  cartPage,
  checkoutPage,
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-008'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  await test.step('Log in and open checkout with a product', async () => {
    await loginPage.open();
    await loginPage.login(credentials);
    await productListPage.addProduct(data.productName, data.addButtonName);
    await cartPage.openFromHeader();
    await cartPage.checkout();
    await expect(checkoutPage.title).toHaveText(data.expectedCheckoutTitle);
  });

  await test.step('Cancel checkout and verify the cart is preserved', async () => {
    await checkoutPage.cancel();
    await expect(cartPage.title).toHaveText(data.expectedCartTitle);
    await expect(cartPage.productName(data.productName)).toHaveText(
      data.productName,
    );
  });
});
