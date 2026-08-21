# REQ-LOGIN-PRODUCT-001 — Requirement Analysis

## Sources

- `requirements/input/REQ-LOGIN-PRODUCT-001.md` — requirement supplied directly by the user on 2026-08-21.

## Objective

Verify that a user can log in with correct credentials, is prevented from entering with incorrect credentials, and can add or remove one unit of a product from the product listing.

## Actors

- User attempting to log in and shop.

## Preconditions

- The web application is available.
- For the successful-login flow, a valid credential profile exists.
- For the unsuccessful-login flow, invalid credentials are available.
- For product actions, the user is authenticated and the product listing contains at least one product.

## Functional Flow

1. The user enters credentials and submits the login form.
2. With correct credentials, the application opens the home page and allows the user to begin shopping by adding a product.
3. With incorrect credentials, the application displays the specified error and does not open the home page.
4. From the product listing, the user adds one product.
5. The added product's button changes to `Remove`, preventing another unit of that same product from being added from the listing.
6. The user selects `Remove` for the product on the listing page to remove it.

## Business and Validation Rules

- Correct credentials permit access to the home page.
- Incorrect credentials display exactly `Epic sadface: Username and password do not match any user in this service` and do not permit access to the home page.
- A product can be added from the product listing.
- Only one unit of a given product can be added from the listing.
- After a successful add, the product's button changes to `Remove`.
- Selecting `Remove` on the listing page removes that product.

## Testable Behaviors

| ID | Behavior | Source trace |
|---|---|---|
| TB-01 | Correct credentials open the home page. | Login AC1 |
| TB-02 | After a correct login, the user can add a product and begin shopping. | Login AC1 |
| TB-03 | Incorrect credentials show the exact specified error message. | Login AC2 |
| TB-04 | Incorrect credentials do not open the home page. | Login AC2 |
| TB-05 | A product can be added from the product listing. | Add product AC1 |
| TB-06 | After adding a product, that product's button becomes `Remove`, so a second unit cannot be added from the listing. | Add product AC1 |
| TB-07 | Selecting `Remove` for an added product on the listing removes it. | Add product AC2 |

## Suggested Test Layers

| Behavior | Suggested layer | Rationale |
|---|---|---|
| TB-01 | UI | Verify browser navigation after form submission. |
| TB-02 | End-to-End | Covers login through the start of shopping. |
| TB-03, TB-04 | UI | Verify rendered validation and blocked navigation. |
| TB-05, TB-06 | UI | Verify listing interaction and button state. |
| TB-07 | UI | Verify removal through the listing control. |

## API-to-UI Dependencies

- None explicitly stated by the source.

## Unclear Points

- The application URL and environment are not stated; confirmation is needed before live UI inspection or execution.
- The valid credential profile is not named; confirmation is needed before execution. Real credentials must remain in `.env`.
- The invalid username and password values are not specified; confirmation is needed before execution, although testcase proposals can refer to an invalid credential dataset.
- The exact route, title, or unique UI indicator that proves the home page opened is not stated; confirmation is needed before defining the final assertion.
- The product to use is not named; confirmation is needed if a fixed product is required rather than any available listing item.
- The expected visible state after removal is not stated (for example, whether the button returns to `Add to cart` and whether a cart badge changes); confirmation is needed before testing those outcomes.
- The source ends with an additional `AC2:` label without content; the missing acceptance criterion must be supplied if it describes another scenario.

## Excluded from Testcase Generation

- Any behavior implied by the final incomplete `AC2:` label.
- Exact post-removal button text or cart badge behavior, because the source does not define it.
- API preparation, persistence after refresh, cart-page behavior, checkout, logout, locked users, empty fields, performance, accessibility, and security behavior, because they are not specified.
