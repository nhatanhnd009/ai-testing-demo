import testData from './invalid-login.json';
import { expect, test } from '../../fixtures/test.fixture';

test('HC-002 | Reject invalid credentials', async ({
  loginPage,
  productListPage,
}) => {
  const data = testData['HC-002'];

  await test.step('Open the login page', async () => {
    await loginPage.open();
  });

  await test.step('Submit invalid credentials', async () => {
    await loginPage.login(data.credentials);
  });

  await test.step('Verify the login rejection', async () => {
    await expect(loginPage.errorMessage).toHaveText(data.expectedError);
    await expect(productListPage.title).toHaveCount(data.expectedProductTitleCount);
  });
});
