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

export const SeveritySchema = z.enum(['low', 'medium', 'high']);
export type Severity = z.infer<typeof SeveritySchema>;

/** One risk flagged for a quarter. */
export const RiskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: SeveritySchema,
  detail: z.string().min(1),
});
export type Risk = z.infer<typeof RiskSchema>;

/** One quarter of synthetic company data. */
export const QuarterSchema = z.object({
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
  /** Revenue in USD. */
  revenue: z.number().nonnegative(),
  /** Gross margin in percent. */
  grossMargin: z.number(),
  /** Customer churn in percent. */
  churn: z.number().nonnegative(),
  risks: z.array(RiskSchema),
});
export type Quarter = z.infer<typeof QuarterSchema>;

/** Full company report for one tenant (data/<tenantId>.json). Includes risks. */
export const CompanyReportSchema = z.object({
  tenantId: z.string().min(1),
  company: z.string().min(1),
  quarters: z.array(QuarterSchema),
});
export type CompanyReport = z.infer<typeof CompanyReportSchema>;

/** Successful body of POST /api/assistant once the output is validated (Exercise B). */
export const AssistantSuccessSchema = z.object({
  insight: InsightSchema,
});
export type AssistantSuccess = z.infer<typeof AssistantSuccessSchema>;

/** Error body of POST /api/assistant (Exercise B adds the fallback). */
export const AssistantFailureSchema = z.object({
  error: z.string().min(1),
  fallback: z.object({ message: z.string().min(1) }).optional(),
});
export type AssistantFailure = z.infer<typeof AssistantFailureSchema>;
