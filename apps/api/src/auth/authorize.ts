import type { SessionUser } from '@workshop/contracts';

/** Something a user wants to read. The tenant is the one the request asked for. */
export interface Resource {
  kind: 'risk-report';
  tenantId: string;
}

/** Thrown when the session user may not read a resource. The app error handler answers 403. */
export class ForbiddenError extends Error {
  override name = 'ForbiddenError';

  constructor(readonly reason: 'other_tenant' | 'role') {
    super('forbidden');
  }
}

/** Call it BEFORE loading any tenant data. Deny by default: other tenant or viewer role. */
export function assertCanRead(user: SessionUser, resource: Resource): void {
  if (resource.tenantId !== user.tenantId) throw new ForbiddenError('other_tenant');
  if (user.role === 'viewer') throw new ForbiddenError('role');
}
