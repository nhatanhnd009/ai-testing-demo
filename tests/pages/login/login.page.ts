import type { Locator, Page } from '@playwright/test';

import {
  loadUiConfig,
  type CredentialProfile,
} from '../../config/environment';

export class LoginPage {
  readonly errorMessage: Locator;
  readonly loginButton: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  async open(): Promise<void> {
    await this.page.goto(loadUiConfig().loginUrl);
  }

  async login(credentials: CredentialProfile): Promise<void> {
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.loginButton.click();
  }
}
