import testData from './remove-product.json';
import { loadCredentialProfile, type CredentialProfileName } from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-004 | Remove one product from the listing', async ({
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-004'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  await test.step('Log in and add the product precondition', async () => {
    await loginPage.open();
    await loginPage.login(credentials);
    await productListPage.addProduct(data.productName, data.addButtonName);
    await expect(
      productListPage.productButton(data.productName, data.removeButtonName),
    ).toBeVisible();
  });

  await test.step('Remove the product from the listing', async () => {
    await productListPage.removeProduct(data.productName, data.removeButtonName);
    await expect(
      productListPage.productButton(data.productName, data.removeButtonName),
    ).toHaveCount(data.expectedRemoveButtonCount);
  });
});
