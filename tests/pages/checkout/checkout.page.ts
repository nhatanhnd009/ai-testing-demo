import type { Locator, Page } from '@playwright/test';

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  zipCode: string;
};

type CheckoutCustomerField = keyof CheckoutCustomer;

export class CheckoutPage {
  readonly cancelButton: Locator;
  readonly continueButton: Locator;
  readonly errorContainer: Locator;
  readonly errorMessage: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.cancelButton = page.getByTestId('cancel');
    this.continueButton = page.getByTestId('continue');
    this.errorMessage = page.getByTestId('error');
    this.errorContainer = page.locator('.error-message-container');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async fillInformation(customer: CheckoutCustomer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.zipCode);
  }

  async fillInformationExcept(
    customer: CheckoutCustomer,
    missingField: string,
  ): Promise<void> {
    const fields: Record<CheckoutCustomerField, Locator> = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      zipCode: this.postalCodeInput,
    };

    for (const [field, locator] of Object.entries(fields)) {
      if (field !== missingField) {
        await locator.fill(customer[field as CheckoutCustomerField]);
      }
    }
  }
}
