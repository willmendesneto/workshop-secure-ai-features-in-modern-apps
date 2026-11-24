# Row-Level Security (optional extra layer)

> This repo keeps company data in JSON files in memory, so this page is reading material only.
> Nothing here runs in the workshop.

## What it is

Postgres **Row-Level Security (RLS)** lets the database filter rows per request. You enable it on
a table and write a policy; from then on every `SELECT`, `UPDATE` and `DELETE` by a normal role
only sees the rows the policy allows, even if the query forgot its `WHERE tenant_id = ...`.

## Example

```sql
ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_reports FORCE ROW LEVEL SECURITY; -- also applies to the table owner

CREATE POLICY tenant_isolation ON risk_reports
  USING (tenant_id = current_setting('app.tenant_id')::text);
```

Set the tenant **per request, inside a transaction**, from the verified session (never from the
request body):

```sql
BEGIN;
SET LOCAL app.tenant_id = 'acme';            -- or: SELECT set_config('app.tenant_id', $1, true);
SELECT * FROM risk_reports;                  -- only acme rows, even without a WHERE clause
COMMIT;
```

In Node, use `set_config` with a bind parameter so the value is never concatenated into SQL:

```ts
await client.query('BEGIN');
await client.query("SELECT set_config('app.tenant_id', $1, true)", [sessionUser(res).tenantId]);
const { rows } = await client.query('SELECT * FROM risk_reports');
await client.query('COMMIT');
```

## Why it is defense in depth

- The API still derives the tenant from the session and still calls `assertCanRead` before any
  read. That is the control the tests protect.
- RLS catches the query you forgot to scope: a new endpoint, a report job, a tool the assistant
  calls. A missing check returns zero rows instead of another tenant's data.
- RLS does not know about roles like `viewer` unless you model them too. Keep the permission check
  in the API.

## Caveats

- **Connection pooling:** a plain `SET` sticks to the pooled connection and leaks into the next
  request. Use `SET LOCAL` / `set_config(..., true)` inside a transaction. With PgBouncer in
  transaction mode, session-level settings do not work at all.
- **Missing setting:** `current_setting('app.tenant_id')` errors when unset; with
  `current_setting('app.tenant_id', true)` it returns `NULL` and the policy matches no rows. Both
  fail closed, which is what you want.
- **Bypass:** superusers and roles with `BYPASSRLS` ignore every policy. The app must connect with
  a dedicated, non-superuser role.
- **Table owners** skip RLS unless you add `FORCE ROW LEVEL SECURITY`. Migrations usually run as
  the owner, so test with the app role.
- **Views and functions** run with their owner's rights by default (`security_invoker` matters).
