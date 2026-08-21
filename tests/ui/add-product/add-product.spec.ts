import testData from './add-product.json';
import { loadCredentialProfile, type CredentialProfileName } from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-003 | Add only one unit of a product from the listing', async ({
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-003'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  await test.step('Log in and open the product listing', async () => {
    await loginPage.open();
    await loginPage.login(credentials);
    await expect(productListPage.title).toHaveText(data.expectedPageTitle);
  });

  await test.step('Add one displayed product', async () => {
    await productListPage.addProduct(data.productName, data.addButtonName);
  });

  await test.step('Verify the same product cannot be added again', async () => {
    await expect(
      productListPage.productButton(data.productName, data.removeButtonName),
    ).toBeVisible();
    await expect(
      productListPage.productButton(data.productName, data.addButtonName),
    ).toHaveCount(data.expectedAddButtonCount);
  });
});
