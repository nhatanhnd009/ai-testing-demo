# REQ-LOGIN-PRODUCT-001 — Login and Product Listing

## Source

Requirement supplied directly by the user on 2026-08-21.

## Login

### AC1 — Successful login

- When login credentials are correct, the user can access the home page successfully.
- The user can add a product to begin shopping.

### AC2 — Unsuccessful login

- When login credentials are incorrect, show this message exactly:
  `Epic sadface: Username and password do not match any user in this service`
- The user cannot access the home page.

## Add product

### AC1 — Add from product listing

- A product can be added from the product listing.
- Only one unit can be added for each product from the listing.
- After a product is added successfully, its button changes to `Remove`.

### AC2 — Remove from product listing

- A product can be removed by selecting `Remove` on the product listing page.

## Incomplete source text

The supplied requirement ends with an additional `AC2:` label without content.
