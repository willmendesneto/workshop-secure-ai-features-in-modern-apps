import { readFileSync } from 'node:fs';
import { CompanyReportSchema, type CompanyReport } from '@workshop/contracts';

// Resolved from this module's location (src/data or dist/data), so it works from any cwd.
const dataDir = new URL('../../../../data/', import.meta.url);

// Fixed allow-list: file names never come from request input (no path traversal).
const TENANTS = ['acme', 'globex'] as const;

function load(tenantId: string): CompanyReport {
  const raw: unknown = JSON.parse(readFileSync(new URL(`${tenantId}.json`, dataDir), 'utf8'));
  return CompanyReportSchema.parse(raw);
}

const reports = new Map<string, CompanyReport>(TENANTS.map((id) => [id, load(id)]));

/** Full report (including risks) for a tenant, or undefined for an unknown tenant. */
export function getReport(tenantId: string): CompanyReport | undefined {
  return reports.get(tenantId);
}
