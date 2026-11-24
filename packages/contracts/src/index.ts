// Shared runtime contracts for the API and the web app.
// This is the single entry point of the package: import everything from '@workshop/contracts'.
import { z } from 'zod';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/** Structured answer the assistant must return. */
export const InsightSchema = z.object({
  summary: z.string().min(1).max(2000),
  riskLevel: RiskLevelSchema,
  recommendations: z.array(z.string().min(1).max(500)).min(1).max(5),
});
export type Insight = z.infer<typeof InsightSchema>;

/** Body of POST /api/assistant. */
export const AskRequestSchema = z.object({
  question: z.string(), // WORKSHOP(B): enforce max length
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

export const RoleSchema = z.enum(['analyst', 'viewer']);
export type Role = z.infer<typeof RoleSchema>;

/** A user as stored in data/users.json and as carried by a verified session. */
export const UserSchema = z.object({
  userId: z.string().min(1),
  email: z.string().min(1),
  tenantId: z.string().min(1),
  role: RoleSchema,
});
export type SessionUser = z.infer<typeof UserSchema>;

/** Body of POST /api/auth/login. */
export const LoginRequestSchema = z.object({
  email: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
