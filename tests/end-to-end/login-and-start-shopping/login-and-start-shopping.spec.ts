import testData from './login-and-start-shopping.json';
import { loadCredentialProfile, type CredentialProfileName } from '../../config/environment';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-001 | Login successfully and start shopping', async ({
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-001'];
  const credentials = loadCredentialProfile(
    data.credentialProfile as CredentialProfileName,
  );

  await test.step('Open the login page', async () => {
    await loginPage.open();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  await test.step('Log in with the valid credential profile', async () => {
    await loginPage.login(credentials);
    await expect(productListPage.title).toHaveText(data.expectedPageTitle);
  });

  await test.step('Add a product and inspect its state', async () => {
    await productListPage.addProduct(data.productName, data.addButtonName);
    await expect(
      productListPage.productButton(data.productName, data.removeButtonName),
    ).toBeVisible();
  });
});
