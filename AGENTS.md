# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express point-of-sale, inventory, Khata ledger, and GST invoicing app. `server.js` configures the web app; `config.js` contains shop and tax settings. API handlers live in `routes/`, with business logic in `lib/` (pricing, coupons, tax, orders, inventory, ledger, reports, invoices, and storage). Browser assets are in `public/`; `data/db.json` is the local data store. Architecture documentation is in `docs/`. There is no dedicated test directory in the repository.

## Build, Test, and Development Commands

- `npm start` — starts the Express server using `config.port` (default `3000`).
- `npm test` — currently a placeholder that exits with “Error: no test specified”; it does not run tests.

No build, lint, or formatting commands are configured. Do not assume test coverage where none exists.

## Coding Style & Naming Conventions

Follow the existing CommonJS and JavaScript style: two-space indentation, single-quoted strings, semicolons, and descriptive camelCase function and variable names. Route files use plural resource names (for example, `routes/orders.js`); library files use concise lower-case names (for example, `lib/pricing.js`). Keep HTTP handling in route modules and reusable business rules in `lib/`. Preserve the current API and stored JSON shapes unless a change explicitly calls for migration.

## Testing Guidelines

There is no test framework or test suite configured. For changes, add focused tests if introducing a test setup, and document how to run them. At minimum, manually verify affected routes and calculation paths in a safe development data copy; do not use production data for experiments. Check checkout and invoice calculations separately because they currently use separate logic.

## Commit & Pull Request Guidelines

Recent commits use short, lower-case, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and describe the user-visible change. Pull requests should explain the behavior change, note affected routes/modules and any data-shape changes, include verification steps, and add UI screenshots when the browser interface changes. Call out security, GST, inventory, or Khata impacts explicitly.

## Data & Configuration Safety

`data/db.json` holds operational records and is rewritten as a whole by `lib/store.js`. Avoid committing real customer data or editing live records for testing. Shop settings, coupon definitions, tax slabs, and the admin key are currently in `config.js`; keep secrets out of source control and treat changes to tax or coupon rules as behavior changes requiring review.
